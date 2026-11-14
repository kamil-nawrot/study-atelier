import { foldedName, SHOWN_TERMS } from '#lib/exhibitions/editor/term-search/term-search.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';

export function matchingSymbols(
	symbols: readonly SymbolOption[],
	query: string,
	limit = SHOWN_TERMS
): SymbolOption[] {
	const phrase = foldedName(query.trim());
	const sorted = [...symbols].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
	if (phrase === '') return sorted.slice(0, limit);
	const starts = (symbol: SymbolOption): boolean => foldedName(symbol.name).startsWith(phrase);
	return sorted
		.filter((symbol) => foldedName(symbol.name).includes(phrase))
		.sort((a, b) => Number(starts(b)) - Number(starts(a)))
		.slice(0, limit);
}

export function symbolOf(
	symbols: readonly SymbolOption[] | undefined,
	id: unknown
): SymbolOption | undefined {
	return symbols?.find((symbol) => symbol.id === id);
}
