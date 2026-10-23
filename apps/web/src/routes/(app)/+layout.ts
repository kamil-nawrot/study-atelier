import { redirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { resolve } from '$app/paths';
import { startOfDay } from '#lib/review/queue.ts';
import {
	loadReviewCounts,
	REVIEW_COUNTS_DEPENDENCY,
	waitingToday
} from '#lib/review/review-data.ts';
import { loadPreferences, PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data.ts';
import { loadProfile, PROFILE_DEPENDENCY } from '#lib/profile/profile-data.ts';
import type { Profile } from '#lib/profile/types.ts';
import type { LayoutLoad } from './$types';

type AppLayoutData = {
	session: Session;
	reviewWaiting?: Promise<number>;
	menuProfile?: Promise<Profile | undefined>;
};

async function ownProfile(): Promise<Profile | undefined> {
	const { profile, error } = await loadProfile();
	return error ? undefined : profile;
}

async function reviewWaiting(): Promise<number> {
	const [{ counts }, { preferences }] = await Promise.all([
		loadReviewCounts(startOfDay(new Date())),
		loadPreferences()
	]);
	return counts ? waitingToday(counts, preferences.reviewNewPerDay) : 0;
}

export const load: LayoutLoad = async ({ parent, depends }): Promise<AppLayoutData> => {
	depends(REVIEW_COUNTS_DEPENDENCY, PROFILE_DEPENDENCY, PREFERENCES_DEPENDENCY);
	const { session } = await parent();
	if (!session) redirect(307, resolve('/(auth)/sign-in'));
	return { session, reviewWaiting: reviewWaiting(), menuProfile: ownProfile() };
};
