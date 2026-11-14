import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';
import type { MeaningSection } from '#lib/symbols/types/meaning-section.ts';
import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';
import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';
import type { SymbolPin } from '#lib/symbols/types/symbol-pin.ts';

function bylineOf(artwork: WallArtwork): string {
	const authors = artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor;
	return artwork.date ? `${authors}, ${artwork.date}` : authors;
}

export function symbolDetails(
	pins: readonly SymbolPin[],
	artworks: readonly WallArtwork[],
	lenses: ReadonlyMap<string, FragmentLens>
): SymbolDetail[] {
	const shown = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	return pins.flatMap((pin) => {
		const artwork = shown.get(pin.artworkId);
		if (!artwork) return [];
		const lens = lenses.get(pin.pinId);
		return [
			{
				pinId: pin.pinId,
				meaningId: pin.meaningId,
				artworkId: artwork.id,
				number: artwork.number,
				title: artwork.title,
				byline: bylineOf(artwork),
				year: artwork.yearFrom ?? artwork.yearTo,
				...(lens ? { lens } : {})
			}
		];
	});
}

export function meaningSections(
	meanings: readonly SymbolMeaning[],
	details: readonly SymbolDetail[]
): MeaningSection[] {
	return meanings.map((meaning) => ({
		meaning,
		details: details.filter((detail) => detail.meaningId === meaning.id)
	}));
}

export function detailsWithoutMeaning(
	meanings: readonly SymbolMeaning[],
	details: readonly SymbolDetail[]
): SymbolDetail[] {
	const known = new Set(meanings.map((meaning) => meaning.id));
	return details.filter((detail) => detail.meaningId === null || !known.has(detail.meaningId));
}
