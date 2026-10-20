import { redirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { resolve } from '$app/paths';
import { startOfDay } from '#lib/review/queue.ts';
import {
	loadReviewCounts,
	REVIEW_COUNTS_DEPENDENCY,
	waitingToday
} from '#lib/review/review-data.ts';
import type { LayoutLoad } from './$types';

type AppLayoutData = {
	session: Session;
	reviewWaiting?: Promise<number>;
};

async function reviewWaiting(): Promise<number> {
	const { counts } = await loadReviewCounts(startOfDay(new Date()));
	return counts ? waitingToday(counts) : 0;
}

export const load: LayoutLoad = async ({ parent, depends }): Promise<AppLayoutData> => {
	depends(REVIEW_COUNTS_DEPENDENCY);
	const { session } = await parent();
	if (!session) redirect(307, resolve('/(auth)/sign-in'));
	return { session, reviewWaiting: reviewWaiting() };
};
