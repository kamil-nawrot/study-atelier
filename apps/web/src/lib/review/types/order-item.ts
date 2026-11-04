import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type OrderItem = {
	mode: 'order';
	artworks: WallArtwork[];
};
