import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { ValueSummaries } from '#lib/card-index/types/value-summaries.ts';

export function emptyValueSummaries(): ValueSummaries {
	return { eras: {}, values: {}, countries: {} };
}

export function summaryKey(category: CategoryCode, name: string): string {
	return `${category}:${name}`;
}
