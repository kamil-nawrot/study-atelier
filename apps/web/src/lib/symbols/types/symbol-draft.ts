import type { MeaningDraft } from './meaning-draft.ts';

export type SymbolDraft = {
	name: string;
	description: string;
	meanings: MeaningDraft[];
};
