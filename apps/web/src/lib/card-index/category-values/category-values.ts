import type { CategoryValues } from '#lib/card-index/types/category-values.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';

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
