import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';
import { contextCandidates } from '#lib/symbols/context-candidates/context-candidates.ts';
import {
	detailsWithoutMeaning,
	meaningSections,
	symbolDetails
} from '#lib/symbols/symbol-page/symbol-page.ts';
import { loadSymbol, loadSymbolPins } from '#lib/symbols/symbols-data/symbols-data.ts';
import type { SymbolFormResult } from '#lib/symbols/types/symbol-form-result.ts';
import type { SymbolPageResult } from '#lib/symbols/types/symbol-page-result.ts';
import { loadArtworksOfSymbol } from '#lib/wall/wall-data/wall-data.ts';

const EMPTY = { sections: [], withoutMeaning: [], details: [] };

export async function loadSymbolPage(id: string): Promise<SymbolPageResult> {
	const [found, pins, atelier] = await Promise.all([
		loadSymbol(id),
		loadSymbolPins(id),
		loadArtworksOfSymbol(id)
	]);
	if (!found.symbol) return { ...EMPTY, notFound: found.notFound, error: found.error };
	const symbol = found.symbol;
	const detailsError = pins.error ?? atelier.error;
	if (detailsError) {
		return { ...EMPTY, symbol, sections: meaningSections(symbol.meanings, []), detailsError };
	}
	const lenses = await fragmentLenses(
		pins.pins.flatMap((pin): PinFragment[] => (pin.fragment ? [pin.fragment] : []))
	);
	const details = symbolDetails(pins.pins, atelier.artworks, lenses);
	return {
		symbol,
		sections: meaningSections(symbol.meanings, details),
		withoutMeaning: detailsWithoutMeaning(symbol.meanings, details),
		details
	};
}

export async function loadSymbolForm(id?: string): Promise<SymbolFormResult> {
	if (id) {
		const found = await loadSymbol(id);
		if (found.error) return { candidates: [], error: found.error };
		if (!found.symbol) return { candidates: [], notFound: true };
		return { symbol: found.symbol, candidates: [] };
	}
	const [cardIndex, glossary] = await Promise.all([loadCardIndex(), loadTermIndex()]);
	const error = cardIndex.error ?? glossary.error;
	if (error) return { candidates: [], error };
	return { candidates: contextCandidates(cardIndex.index, glossary.terms) };
}
