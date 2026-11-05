import type { ReviewRating } from './review-rating.ts';

export type YearOutcome = {
	rating: ReviewRating;
	miss: number;
	direction: 'early' | 'late' | 'inside';
};
