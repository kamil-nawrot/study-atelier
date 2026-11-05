import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ReviewCard } from './review-card.ts';

export type YearItem = {
	mode: 'year';
	artwork: WallArtwork;
	card: ReviewCard | null;
};
