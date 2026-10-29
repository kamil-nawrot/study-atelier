import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type SummaryGroup = {
	rating: ReviewRating;
	artworks: WallArtwork[];
};
