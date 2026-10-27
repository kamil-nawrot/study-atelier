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
import {
	loadPreferences,
	PREFERENCES_DEPENDENCY
} from '#lib/profile/preferences-data/preferences-data.ts';
import { loadProfile, PROFILE_DEPENDENCY } from '#lib/profile/profile-data/profile-data.ts';
import { loadAcceptedLegalVersion } from '#lib/legal/legal-data/legal-data.ts';
import type { Profile } from '#lib/profile/types/profile.ts';
import type { LayoutLoad } from './$types';

type AppLayoutData = {
	session: Session;
	reviewWaiting?: Promise<number>;
	menuProfile?: Promise<Profile | undefined>;
	acceptedLegalVersion?: Promise<string | null | undefined>;
};

async function ownProfile(): Promise<Profile | undefined> {
	const { profile, error } = await loadProfile();
	return error ? undefined : profile;
}

async function reviewWaiting(newPerDay: number): Promise<number> {
	const { counts } = await loadReviewCounts(startOfDay(new Date()));
	return counts ? waitingToday(counts, newPerDay) : 0;
}

export const load: LayoutLoad = async ({ parent, depends }): Promise<AppLayoutData> => {
	depends(REVIEW_COUNTS_DEPENDENCY, PROFILE_DEPENDENCY, PREFERENCES_DEPENDENCY);
	const { session } = await parent();
	if (!session) redirect(307, resolve('/(auth)/sign-in'));
	const loaded = (await loadPreferences()).preferences;
	applyAutoFetch(loaded);
	return {
		session,
		reviewWaiting: reviewWaiting(loaded.reviewNewPerDay),
		menuProfile: ownProfile(),
		acceptedLegalVersion: loadAcceptedLegalVersion()
	};
};
