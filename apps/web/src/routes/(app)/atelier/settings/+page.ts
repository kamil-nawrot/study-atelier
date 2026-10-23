import { ATELIER_EMPTY_DEPENDENCY, loadAtelierEmpty } from '#lib/import/import-data.ts';
import { loadPreferences, PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data.ts';
import { loadProfile, PROFILE_DEPENDENCY } from '#lib/profile/profile-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
	depends(PROFILE_DEPENDENCY, PREFERENCES_DEPENDENCY, ATELIER_EMPTY_DEPENDENCY);
	const [profile, preferences, atelierEmpty] = await Promise.all([
		loadProfile(),
		loadPreferences(),
		loadAtelierEmpty()
	]);
	return {
		profile: profile.profile,
		preferences: preferences.preferences,
		atelierEmpty,
		error: profile.error ?? preferences.error
	};
};
