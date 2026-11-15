import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewState } from '#lib/review/types/review-state.ts';
import type { SessionCardRow } from '#lib/review/types/session-card-row.ts';

export function sessionCard(artworkId: string, row: SessionCardRow): ReviewCard {
	return {
		artworkId,
		due: new Date(row.due),
		stability: row.stability,
		difficulty: row.difficulty,
		state: row.state as ReviewState,
		reps: row.reps,
		lapses: row.lapses,
		scheduledDays: row.scheduled_days,
		learningSteps: row.learning_steps,
		lastReview: row.last_review ? new Date(row.last_review) : null,
		lastRating: null
	};
}
