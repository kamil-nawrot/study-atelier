import { currentSession, SESSION_DEPENDENCY } from '#lib/auth/session.ts';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ depends }) => {
	depends(SESSION_DEPENDENCY);
	return { session: await currentSession() };
};
