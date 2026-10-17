import { loadAtelier } from '#lib/collection/artworks.ts';
import { startOfDay } from '#lib/review/queue.ts';
import {
	loadReviewCards,
	loadReviewCounts,
	loadReviewStreak,
	REVIEW_COUNTS_DEPENDENCY
} from '#lib/review/review-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
	depends(REVIEW_COUNTS_DEPENDENCY);
	const dayStart = startOfDay(new Date());
	const [atelier, review, counts, streak] = await Promise.all([
		loadAtelier(),
		loadReviewCards(),
		loadReviewCounts(dayStart),
		loadReviewStreak(dayStart)
	]);
	return {
		artworks: atelier.artworks,
		cards: review.cards,
		newToday: counts.counts?.newToday ?? 0,
		streak: streak.days,
		error: atelier.error ?? review.error ?? counts.error
	};
};
