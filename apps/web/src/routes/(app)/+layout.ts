import { redirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { resolve } from '$app/paths';
import { startOfDay } from '#lib/review/queue/queue.ts';
import {
	loadReviewCounts,
	REVIEW_COUNTS_DEPENDENCY,
	waitingToday
} from '#lib/review/review-data/review-data.ts';
import { applyAutoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import { applyEraBounds } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import {
	loadOwnProfile,
	type OwnProfileResult
} from '#lib/profile/own-profile-data/own-profile-data.ts';
import { PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data/preferences-data.ts';
import { PROFILE_DEPENDENCY } from '#lib/profile/profile-data/profile-data.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { Profile } from '#lib/profile/types/profile.ts';
import type { LayoutLoad } from './$types';

type AppLayoutData = {
	session: Session;
	reviewWaiting?: Promise<number>;
	menuProfile?: Promise<Profile | undefined>;
	acceptedLegalVersion?: Promise<string | null | undefined>;
	careerShown?: boolean;
	preferences?: Preferences;
	ownProfile?: OwnProfileResult;
};

async function reviewWaiting(newPerDay: number): Promise<number> {
	const { counts } = await loadReviewCounts(startOfDay(new Date()));
	return counts ? waitingToday(counts, newPerDay) : 0;
}

export const load: LayoutLoad = async ({ parent, depends }): Promise<AppLayoutData> => {
	depends(REVIEW_COUNTS_DEPENDENCY, PROFILE_DEPENDENCY, PREFERENCES_DEPENDENCY);
	const { session } = await parent();
	if (!session) redirect(307, resolve('/(auth)/sign-in'));
	const own = await loadOwnProfile();
	const loaded = own.preferences;
	applyAutoFetch(loaded);
	applyEraBounds(own.eraBounds);
	return {
		session,
		reviewWaiting: reviewWaiting(loaded.reviewNewPerDay),
		menuProfile: Promise.resolve(own.error ? undefined : own.profile),
		acceptedLegalVersion: Promise.resolve(own.legalVersion),
		careerShown: own.profile.careerShown,
		preferences: loaded,
		ownProfile: own
	};
};
