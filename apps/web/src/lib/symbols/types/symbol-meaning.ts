import type { SymbolContext } from './symbol-context.ts';

export type SymbolMeaning = {
	id: string;
	text: string;
	contexts: SymbolContext[];
};
