import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { ValueSummary } from './value-summary.ts';

export type ValueSummaries = {
	eras: Partial<Record<EraCode, ValueSummary>>;
	values: Record<string, ValueSummary>;
	countries: Record<string, string>;
};
