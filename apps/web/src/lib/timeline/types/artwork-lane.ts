import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type ArtworkLane = {
	key: string;
	name: string;
	colour: string;
	artworks: readonly WallArtwork[];
};
