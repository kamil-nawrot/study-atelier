import { loadAtelier } from '#lib/collection/artworks.ts';
import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { loadPreferences, PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data.ts';
import { startOfDay } from '#lib/review/queue.ts';
import {
	loadReviewCards,
	loadReviewCounts,
	loadReviewStreak,
	waitingToday
} from '#lib/review/review-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
	depends(PREFERENCES_DEPENDENCY);
	const dayStart = startOfDay(new Date());
	const [atelier, review, counts, streak, glossary, prefs] = await Promise.all([
		loadAtelier(),
		loadReviewCards(),
		loadReviewCounts(dayStart),
		loadReviewStreak(dayStart),
		loadGlossary(),
		loadPreferences()
	]);
	return {
		artworks: atelier.artworks,
		cards: review.cards,
		newToday: counts.counts?.newToday ?? 0,
		waiting: counts.counts
			? waitingToday(counts.counts, prefs.preferences.reviewNewPerDay)
			: undefined,
		streak: streak.days,
		preferences: prefs.preferences,
		glossary: glossary.entries,
		error: atelier.error ?? review.error ?? counts.error
	};
};
