import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ReviewMode } from './review-mode.ts';
import type { ReviewCard } from './review-card.ts';
import type { Quiz } from './quiz.ts';
import type { ReviewPin } from './review-pin.ts';

export type ReviewItem = {
	artwork: WallArtwork;
	card: ReviewCard | null;
	mode: ReviewMode;
	quiz?: Quiz;
	pin?: ReviewPin;
};
