import { locale, m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { collectionErrorMessage } from './errors.ts';
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

export function startingValues(category: CategoryCode): readonly string[] {
	switch (category) {
		case 'period':
			return m.startingValues.period;
		case 'style':
		case 'material':
			return [...m.startingValues[category]].sort((a, b) => a.localeCompare(b, locale));
		default:
			return [];
	}
}

export async function loadCategoryValues(): Promise<CategoryValuesResult> {
	const { data, error } = await supabase
		.from('artworks')
		.select('artwork_values(category_values(category_code, name))')
		.is('deleted_at', null);
	if (error) return { values: emptyCategoryValues(), error: collectionErrorMessage(error) };

	const names = new Map<CategoryCode, Set<string>>();
	for (const row of (data ?? []) as unknown as ArtworkValuesRow[]) {
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
