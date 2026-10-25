import type { ReviewCard } from '#lib/review/types/review-card.ts';

export function testReviewCard(
	artworkId: string,
	due: Date,
	overrides: Partial<ReviewCard> = {}
): ReviewCard {
	return {
		artworkId,
		due,
		stability: 10,
		difficulty: 5,
		state: 2,
		reps: 3,
		lapses: 0,
		scheduledDays: 10,
		learningSteps: 0,
		lastReview: null,
		...overrides
	};
}
