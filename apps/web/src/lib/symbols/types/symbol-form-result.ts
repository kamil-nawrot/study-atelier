import type { SymbolContext } from './symbol-context.ts';
import type { SymbolEntry } from './symbol-entry.ts';

export type SymbolFormResult = {
	symbol?: SymbolEntry;
	candidates: SymbolContext[];
	notFound?: boolean;
	error?: string;
};
