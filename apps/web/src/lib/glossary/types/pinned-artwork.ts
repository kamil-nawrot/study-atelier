import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type PinnedArtwork = {
	artwork: WallArtwork;
	pinId: string;
};
