import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';

export function seenArtworks(
	visit: Visit,
	artworks: ReadonlyMap<string, WallArtwork>
): WallArtwork[] {
	return visit.artworkIds.flatMap((id) => {
		const artwork = artworks.get(id);
		return artwork ? [artwork] : [];
	});
}

export function seenCount(
	visits: readonly Visit[],
	artworks: ReadonlyMap<string, WallArtwork>
): number {
	return new Set(visits.flatMap((visit) => visit.artworkIds.filter((id) => artworks.has(id)))).size;
}
