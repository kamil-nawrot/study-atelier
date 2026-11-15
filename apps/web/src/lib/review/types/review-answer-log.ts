import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';

export type ReviewAnswerLog = {
	item: ReviewItem;
	rating: ReviewRating;
};
