import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type ValueLinks = {
	periodsByEra: Record<EraCode, string[]>;
	stylesByPeriod: Record<string, string[]>;
};
