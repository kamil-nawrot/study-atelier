import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { countTermPins } from '#lib/pins/pin-data.ts';
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
	const [atelier, review, counts, streak, glossary, prefs, termPins] = await Promise.all([
		loadAtelier(),
		loadReviewCards(),
		loadReviewCounts(dayStart),
		loadReviewStreak(dayStart),
		loadGlossary(),
		loadPreferences(),
		countTermPins()
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
		termPins,
		glossary: glossary.entries,
		error: atelier.error ?? review.error ?? counts.error
	};
};
