import { extraOutcome, ratedOutcome } from '#lib/review/extra-cards/extra-cards.ts';
import { recordExtraReview } from '#lib/review/extra-cards-data/extra-cards-data.ts';
import { recordPairAnswer } from '#lib/review/review-data/review-data.ts';
import type { ExtraQuizItem } from '#lib/review/step-kinds/step-kinds.ts';
import type { EventItem } from '#lib/review/types/event-item.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';

export async function recordExtraAnswer(
	item: ExtraQuizItem,
	correct: boolean,
	now: Date,
	shownAt: number,
	wrongAnswer?: string
): Promise<void> {
	if (item.mode === 'quiz_pair') return recordPairAnswer(item, correct);
	if (item.mode !== 'quiz_definition' && item.mode !== 'quiz_symbol') return;
	const card = extraOutcome(item.card ?? null, correct, now);
	const answer = {
		correct,
		answerMs: now.getTime() - shownAt,
		...(wrongAnswer === undefined ? {} : { wrongAnswer })
	};
	return item.mode === 'quiz_definition'
		? recordExtraReview({ termId: item.term.id }, card, { ...answer, mode: 'quiz_definition' }, now)
		: recordExtraReview(
				{ symbolId: item.symbol.id },
				card,
				{ ...answer, mode: `symbol_${item.kind}` },
				now
			);
}

export async function recordEventAnswer(
	item: EventItem,
	rating: ReviewRating,
	now: Date,
	shownAt: number
): Promise<void> {
	return recordExtraReview(
		{ eventId: item.event.id },
		ratedOutcome(item.card, rating, now),
		{ mode: `event_${item.kind}`, correct: rating > 1, rating, answerMs: now.getTime() - shownAt },
		now
	);
}
