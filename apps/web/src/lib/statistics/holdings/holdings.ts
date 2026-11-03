import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type Holdings = {
	artworks: number;
	authors: number;
	places: number;
	seen: number;
};

export function holdingsOf(artworks: readonly WallArtwork[]): Holdings {
	return {
		artworks: artworks.length,
		authors: new Set(artworks.flatMap((artwork) => artwork.authors)).size,
		places: new Set(artworks.flatMap((artwork) => (artwork.location ? [artwork.location] : [])))
			.size,
		seen: artworks.filter((artwork) => artwork.seen).length
	};
}
