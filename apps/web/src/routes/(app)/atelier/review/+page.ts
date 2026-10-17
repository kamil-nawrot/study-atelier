import { loadAtelier } from '#lib/collection/artworks.ts';
import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { startOfDay } from '#lib/review/queue.ts';
import { loadReviewCards, loadReviewCounts, loadReviewStreak } from '#lib/review/review-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const dayStart = startOfDay(new Date());
	const [atelier, review, counts, streak, glossary] = await Promise.all([
		loadAtelier(),
		loadReviewCards(),
		loadReviewCounts(dayStart),
		loadReviewStreak(dayStart),
		loadGlossary()
	]);
	return {
		artworks: atelier.artworks,
		cards: review.cards,
		newToday: counts.counts?.newToday ?? 0,
		streak: streak.days,
		glossary: glossary.entries,
		error: atelier.error ?? review.error ?? counts.error
	};
};
