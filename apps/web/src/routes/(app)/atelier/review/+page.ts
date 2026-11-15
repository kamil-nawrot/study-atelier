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
import { loadReviewPlan } from '#lib/review/review-plan-data/review-plan-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, untrack }) => {
	const dayStart = startOfDay(new Date());
	const layoutRead = untrack(() => parent());
	const [atelier, review, counts, streak, glossary, layout, termPins, planned] = await Promise.all([
		loadAtelier(),
		loadReviewCards(),
		loadReviewCounts(dayStart),
		loadReviewStreak(dayStart),
		loadTermIndex(),
		layoutRead,
		countTermPins(),
		layoutRead.then((data) =>
			loadReviewPlan(dayStart, (data.preferences ?? defaultPreferences).reviewForm)
		)
	]);
	const preferences = layout.preferences ?? defaultPreferences;
	return {
		artworks: atelier.artworks,
		cards: review.cards,
		styleCards: review.styleCards,
		newToday: counts.counts?.newToday ?? 0,
		waiting: counts.counts?.waiting,
		plan: planned.plan,
		streak: streak.days,
		preferences,
		termPins,
		glossary: glossary.terms,
		error: atelier.error ?? review.error ?? counts.error ?? planned.error
	};
};
