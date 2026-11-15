import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { countTermPins } from '#lib/pins/pin-data/pin-data.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { startOfDay } from '#lib/review/queue/queue.ts';
import {
	loadReviewCards,
	loadReviewCounts,
	loadReviewStreak
} from '#lib/review/review-data/review-data.ts';
import { roundWaiting } from '#lib/review/style-places/style-places.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, untrack }) => {
	const dayStart = startOfDay(new Date());
	const [atelier, review, counts, streak, glossary, layout, termPins] = await Promise.all([
		loadAtelier(),
		loadReviewCards(),
		loadReviewCounts(dayStart),
		loadReviewStreak(dayStart),
		loadTermIndex(),
		untrack(() => parent()),
		countTermPins()
	]);
	const preferences = layout.preferences ?? defaultPreferences;
	return {
		artworks: atelier.artworks,
		cards: review.cards,
		styleCards: review.styleCards,
		newToday: counts.counts?.newToday ?? 0,
		waiting: counts.counts ? roundWaiting(counts.counts, preferences) : undefined,
		streak: streak.days,
		preferences,
		termPins,
		glossary: glossary.terms,
		error: atelier.error ?? review.error ?? counts.error
	};
};
