import type { MeaningSection } from './meaning-section.ts';
import type { SymbolDetail } from './symbol-detail.ts';
import type { SymbolEntry } from './symbol-entry.ts';

export type SymbolPageResult = {
	symbol?: SymbolEntry;
	notFound?: boolean;
	error?: string;
	sections: MeaningSection[];
	withoutMeaning: SymbolDetail[];
	details: SymbolDetail[];
	detailsError?: string;
};
