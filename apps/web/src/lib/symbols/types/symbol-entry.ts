import type { SymbolMeaning } from './symbol-meaning.ts';

export type SymbolEntry = {
	id: string;
	name: string;
	description?: string;
	coverPinId?: string;
	meanings: SymbolMeaning[];
};
