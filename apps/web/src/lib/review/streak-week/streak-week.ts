import type { ReviewCard } from '#lib/review/types/review-card.ts';

export const WEEK_DAYS = 7;

export type StreakDay = {
	weekday: number;
	filled: boolean;
	today: boolean;
};

export function reviewedSince(cards: Iterable<ReviewCard>, dayStart: Date): boolean {
	for (const card of cards) {
		if (card.lastReview && card.lastReview.getTime() >= dayStart.getTime()) return true;
	}
	return false;
}

export function streakWithToday(
	loaded: { streak: number; cards: Map<string, ReviewCard> },
	reviewedToday: boolean,
	dayStart: Date
): number {
	return reviewedToday && !reviewedSince(loaded.cards.values(), dayStart)
		? loaded.streak + 1
		: loaded.streak;
}

export function streakWeek(streak: number, reviewedToday: boolean, today: Date): StreakDay[] {
	const firstFilled = WEEK_DAYS - streak - (reviewedToday ? 0 : 1);
	return Array.from({ length: WEEK_DAYS }, (_, index) => {
		const back = WEEK_DAYS - 1 - index;
		const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
		const isToday = back === 0;
		return {
			weekday: day.getDay(),
			filled: isToday ? reviewedToday : index >= firstFilled,
			today: isToday
		};
	});
}
