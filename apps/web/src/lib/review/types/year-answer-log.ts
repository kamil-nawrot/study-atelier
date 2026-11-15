import type { ReviewRating } from '#lib/review/types/review-rating.ts';

export type YearAnswerLog = {
	artworkId: string;
	guess: number;
	rating: ReviewRating;
};
