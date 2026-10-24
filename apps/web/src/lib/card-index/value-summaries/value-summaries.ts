import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type ValueSummary = {
	summary: string;
	lifeYears?: string;
};

export type ValueSummaries = {
	eras: Partial<Record<EraCode, ValueSummary>>;
	values: Record<string, ValueSummary>;
	countries: Record<string, string>;
};

export function emptyValueSummaries(): ValueSummaries {
	return { eras: {}, values: {}, countries: {} };
}

export function summaryKey(category: CategoryCode, name: string): string {
	return `${category}:${name}`;
}
