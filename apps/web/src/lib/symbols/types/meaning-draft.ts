import type { SymbolContext } from './symbol-context.ts';

export type MeaningDraft = {
	key: string;
	id?: string;
	text: string;
	contexts: SymbolContext[];
};
