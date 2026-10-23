import { loadPreferences, PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data.ts';
import { loadProfile, PROFILE_DEPENDENCY } from '#lib/profile/profile-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
	depends(PROFILE_DEPENDENCY, PREFERENCES_DEPENDENCY);
	const [profile, preferences] = await Promise.all([loadProfile(), loadPreferences()]);
	return {
		profile: profile.profile,
		preferences: preferences.preferences,
		error: profile.error ?? preferences.error
	};
};
