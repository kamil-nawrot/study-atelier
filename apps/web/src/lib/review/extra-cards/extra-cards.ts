import { outcomes, quizRating } from '#lib/review/scheduler/scheduler.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import type { ExtraRound } from '#lib/review/types/extra-round.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';

export const NO_EXTRA_ROUND: ExtraRound = { terms: [], symbols: [] };

function asReviewCard(card: ExtraCard | null): ReviewCard | null {
	return card ? { ...card, artworkId: card.id } : null;
}

export function extraOutcome(card: ExtraCard | null, correct: boolean, now: Date): ReviewCard {
	return outcomes(card?.id ?? '', asReviewCard(card), now)[quizRating(correct)];
}
