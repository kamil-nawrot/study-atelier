import type { ReviewState } from './review-state.ts';

export type ReviewCard = {
	artworkId: string;
	due: Date;
	stability: number;
	difficulty: number;
	state: ReviewState;
	reps: number;
	lapses: number;
	scheduledDays: number;
	learningSteps: number;
	lastReview: Date | null;
};
