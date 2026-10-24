import { locale } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import type { CategoryValues } from '#lib/card-index/types/category-values.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';

type CategoryValuesResult = {
	values: CategoryValues;
	ownValues: Record<string, string[]>;
	error?: string;
};

type CategoryValueRow = {
	category_code: string;
	name: string;
};

type ArtworkValuesRow = {
	artwork_values: { category_values: CategoryValueRow | null }[];
};

export const CATEGORY_CODES: readonly CategoryCode[] = [
	'author',
	'period',
	'style',
	'material',
	'location'
];

export function isCategoryCode(value: string): value is CategoryCode {
	return (CATEGORY_CODES as readonly string[]).includes(value);
}

export const VALUE_NAME_MAX_LENGTH = 200;

export const SINGLE_VALUE_CATEGORIES: readonly CategoryCode[] = ['location'];

export function takesOneValue(category: CategoryCode): boolean {
	return SINGLE_VALUE_CATEGORIES.includes(category);
}

export function emptyCategoryValues(): CategoryValues {
	return { author: [], period: [], style: [], material: [], location: [] };
}

export async function loadCategoryValues(): Promise<CategoryValuesResult> {
	const { data, error } = await supabase
		.from('artworks')
		.select('artwork_values(category_values(category_code, name))')
		.is('deleted_at', null);
	if (error) {
		return { values: emptyCategoryValues(), ownValues: {}, error: collectionErrorMessage(error) };
	}

	const names = new Map<string, Set<string>>();
	for (const row of (data ?? []) as unknown as ArtworkValuesRow[]) {
		for (const { category_values: value } of row.artwork_values) {
			if (!value) continue;
			const set = names.get(value.category_code) ?? new Set<string>();
			set.add(value.name);
			names.set(value.category_code, set);
		}
	}

	const sorted = (code: string): string[] =>
		[...(names.get(code) ?? [])].sort((a, b) => a.localeCompare(b, locale));
	const values = emptyCategoryValues();
	for (const category of CATEGORY_CODES) values[category] = sorted(category);
	const ownValues = Object.fromEntries(
		[...names.keys()].filter((code) => !isCategoryCode(code)).map((code) => [code, sorted(code)])
	);
	return { values, ownValues };
}
