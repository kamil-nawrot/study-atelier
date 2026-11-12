import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
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

function counted(names: readonly string[]): [string, number][] {
	const counts = new Map<string, number>();
	for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
	return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl'));
}

export function meaningSummary(artworks: readonly WallArtwork[]): string | undefined {
	const eras = counted(
		artworks.flatMap((artwork) =>
			artwork.eraCode && isEraCode(artwork.eraCode) ? [m.eras[artwork.eraCode].name] : []
		)
	);
	const periods = counted(
		artworks.flatMap((artwork) => [...(artwork.period ? [artwork.period] : []), ...artwork.styles])
	);
	const authors = counted(artworks.flatMap((artwork) => artwork.authors)).map(([name]) => name);
	const parts = [
		...[...eras, ...periods].map(([name, count]) => `${name} ${count}`),
		...(authors.length > 0 ? [authors.join(', ')] : [])
	];
	return parts.length > 0 ? m.symbols.view.summary(parts.join(' · ')) : undefined;
}

export function meaningSections(
	meanings: readonly SymbolMeaning[],
	details: readonly SymbolDetail[],
	artworks: readonly WallArtwork[]
): MeaningSection[] {
	const byId = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	return meanings.map((meaning) => {
		const own = details.filter((detail) => detail.meaningId === meaning.id);
		const pinned = [...new Set(own.map((detail) => detail.artworkId))].flatMap((id) => {
			const artwork = byId.get(id);
			return artwork ? [artwork] : [];
		});
		const summary = meaningSummary(pinned);
		return { meaning, details: own, ...(summary ? { summary } : {}) };
	});
}

export function detailsWithoutMeaning(
	meanings: readonly SymbolMeaning[],
	details: readonly SymbolDetail[]
): SymbolDetail[] {
	const known = new Set(meanings.map((meaning) => meaning.id));
	return details.filter((detail) => detail.meaningId === null || !known.has(detail.meaningId));
}
