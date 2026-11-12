import type { SymbolDetail } from './symbol-detail.ts';
import type { SymbolMeaning } from './symbol-meaning.ts';

export type MeaningSection = {
	meaning: SymbolMeaning;
	details: SymbolDetail[];
	summary?: string;
};
