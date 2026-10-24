import { type Card, type Grade, createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewState } from '#lib/review/types/review-state.ts';

const scheduler = fsrs(
	generatorParameters({ request_retention: 0.9, enable_fuzz: true, enable_short_term: false })
);

export const RATINGS: readonly ReviewRating[] = [1, 2, 3];

function fsrsCard(card: ReviewCard | null, now: Date): Card {
	if (!card) return createEmptyCard(now);
	return {
		due: card.due,
		stability: card.stability,
		difficulty: card.difficulty,
		elapsed_days: 0,
		scheduled_days: card.scheduledDays,
		learning_steps: card.learningSteps,
		reps: card.reps,
		lapses: card.lapses,
		state: card.state,
		last_review: card.lastReview ?? undefined
	};
}

function reviewCard(artworkId: string, card: Card): ReviewCard {
	return {
		artworkId,
		due: card.due,
		stability: card.stability,
		difficulty: card.difficulty,
		state: card.state as number as ReviewState,
		reps: card.reps,
		lapses: card.lapses,
		scheduledDays: card.scheduled_days,
		learningSteps: card.learning_steps,
		lastReview: card.last_review ?? null
	};
}

export function schedule(
	artworkId: string,
	card: ReviewCard | null,
	rating: ReviewRating,
	now: Date
): ReviewCard {
	const next = scheduler.next(fsrsCard(card, now), now, rating as Grade);
	return reviewCard(artworkId, next.card);
}

export function outcomes(
	artworkId: string,
	card: ReviewCard | null,
	now: Date
): Record<ReviewRating, ReviewCard> {
	const preview = scheduler.repeat(fsrsCard(card, now), now);
	return {
		1: reviewCard(artworkId, preview[1].card),
		2: reviewCard(artworkId, preview[2].card),
		3: reviewCard(artworkId, preview[3].card)
	};
}

export function quizRating(correct: boolean): ReviewRating {
	return correct ? 2 : 1;
}
