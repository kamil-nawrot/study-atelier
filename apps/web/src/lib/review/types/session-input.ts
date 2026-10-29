import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type SessionInput = {
	artworks: WallArtwork[];
	cards: Map<string, ReviewCard>;
	now: Date;
	newToday: number;
	sessionSize?: number;
	newPerDay?: number;
};
