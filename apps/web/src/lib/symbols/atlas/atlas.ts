import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';
import type { AtlasSymbol } from '#lib/symbols/types/atlas-symbol.ts';

const SORT_KEY = 'study-atelier:symbol-sort';

export const SYMBOL_SORTS = ['name', 'recent', 'details'] as const;

export type SymbolSort = (typeof SYMBOL_SORTS)[number];

export function rememberedSymbolSort(): SymbolSort {
	const stored = readStored('local', SORT_KEY);
	return SYMBOL_SORTS.find((sort) => sort === stored) ?? 'name';
}

export function rememberSymbolSort(sort: SymbolSort): void {
	writeStored('local', SORT_KEY, sort);
}

function byName(a: AtlasSymbol, b: AtlasSymbol): number {
	return a.name.localeCompare(b.name, 'pl');
}

const ORDERS: Record<SymbolSort, (a: AtlasSymbol, b: AtlasSymbol) => number> = {
	name: byName,
	recent: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || byName(a, b),
	details: (a, b) => b.pinCount - a.pinCount || byName(a, b)
};

export function shownSymbols(
	symbols: readonly AtlasSymbol[],
	query: string,
	sort: SymbolSort
): AtlasSymbol[] {
	const term = normalizeForSearch(query);
	return symbols
		.filter((symbol) => !term || normalizeForSearch(symbol.name).includes(term))
		.sort(ORDERS[sort]);
}
