import { locale } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { fetchAllRows } from './paged-rows.ts';
import type { CategoryCode, CategoryValues, CategoryValuesResult } from './types.ts';

type CategoryValueRow = {
	category_code: CategoryCode;
	name: string;
};

type ArtworkValuesRow = {
	artwork_values: { category_values: CategoryValueRow | null }[];
};

export const SINGLE_VALUE_CATEGORIES: readonly CategoryCode[] = ['location'];

export function takesOneValue(category: CategoryCode): boolean {
	return SINGLE_VALUE_CATEGORIES.includes(category);
}

export function emptyCategoryValues(): CategoryValues {
	return { author: [], period: [], style: [], material: [], location: [] };
}

export async function loadCategoryValues(): Promise<CategoryValuesResult> {
	const { rows, error } = await fetchAllRows<ArtworkValuesRow>((from, to) =>
		supabase
			.from('artworks')
			.select('artwork_values(category_values(category_code, name))')
			.is('deleted_at', null)
			.order('id')
			.range(from, to)
	);
	if (error) return { values: emptyCategoryValues(), error };

	const names = new Map<CategoryCode, Set<string>>();
	for (const row of rows) {
		for (const { category_values: value } of row.artwork_values) {
			if (!value) continue;
			const set = names.get(value.category_code) ?? new Set<string>();
			set.add(value.name);
			names.set(value.category_code, set);
		}
	}

	const values = emptyCategoryValues();
	for (const category of Object.keys(values) as CategoryCode[]) {
		values[category] = [...(names.get(category) ?? [])].sort((a, b) => a.localeCompare(b, locale));
	}
	return { values };
}
