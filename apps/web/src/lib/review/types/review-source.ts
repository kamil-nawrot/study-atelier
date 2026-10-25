import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type ReviewSource = {
	artworks: WallArtwork[];
	cards: Map<string, ReviewCard>;
	newToday: number;
	preferences: Preferences;
	termPins: number | undefined;
};
