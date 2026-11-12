import type { SymbolMeaning } from './symbol-meaning.ts';

export type SymbolEntry = {
	id: string;
	name: string;
	meanings: SymbolMeaning[];
};
