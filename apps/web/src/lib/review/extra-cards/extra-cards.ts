import { startOfDay } from '#lib/review/queue/queue.ts';
import { shuffle } from '#lib/review/quiz/quiz.ts';
import { outcomes, quizRating } from '#lib/review/scheduler/scheduler.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import type { ExtraCards } from '#lib/review/types/extra-cards.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { SymbolQuestionKind } from '#lib/review/types/symbol-question-kind.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const KIND_ORDER: readonly SymbolQuestionKind[] = ['symbol', 'meaning', 'attribute'];

export const NO_EXTRA_CARDS: ExtraCards = {
	terms: new Map(),
	symbols: new Map(),
	askedKinds: new Map()
};

export type Picked<T> = { item: T; card: ExtraCard | null };

export function dueFirst<T>(
	items: readonly T[],
	cardOf: (item: T) => ExtraCard | undefined,
	count: number,
	now: Date,
	random: () => number = Math.random
): Picked<T>[] {
	if (count <= 0) return [];
	const dayEnd = startOfDay(now).getTime() + DAY_MS;
	const due: Picked<T>[] = [];
	const fresh: T[] = [];
	for (const item of items) {
		const card = cardOf(item);
		if (!card) fresh.push(item);
		else if (card.due.getTime() < dayEnd) due.push({ item, card });
	}
	due.sort((first, second) => (first.card?.due.getTime() ?? 0) - (second.card?.due.getTime() ?? 0));
	const drawn = shuffle(fresh, random).map((item) => ({ item, card: null }));
	return [...due, ...drawn].slice(0, count);
}

export function leastAskedKind(
	kinds: readonly SymbolQuestionKind[],
	asked: Partial<Record<SymbolQuestionKind, number>> = {}
): SymbolQuestionKind | undefined {
	return [...kinds].sort(
		(first, second) =>
			(asked[first] ?? -Infinity) - (asked[second] ?? -Infinity) ||
			KIND_ORDER.indexOf(first) - KIND_ORDER.indexOf(second)
	)[0];
}

function asReviewCard(card: ExtraCard | null): ReviewCard | null {
	return card ? { ...card, artworkId: card.id } : null;
}

export function extraOutcome(card: ExtraCard | null, correct: boolean, now: Date): ReviewCard {
	return outcomes(card?.id ?? '', asReviewCard(card), now)[quizRating(correct)];
}
