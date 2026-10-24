import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type TrashArtwork = WallArtwork & {
	deletedAt: string;
};
