import { loadAtelier } from '#lib/collection/artworks.ts';
import { startOfDay } from '#lib/review/queue.ts';
import { loadReviewCards, loadReviewCounts } from '#lib/review/review-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [atelier, review, counts] = await Promise.all([
		loadAtelier(),
		loadReviewCards(),
		loadReviewCounts(startOfDay(new Date()))
	]);
	return {
		artworks: atelier.artworks,
		cards: review.cards,
		newToday: counts.counts?.newToday ?? 0,
		error: atelier.error ?? review.error ?? counts.error
	};
};
