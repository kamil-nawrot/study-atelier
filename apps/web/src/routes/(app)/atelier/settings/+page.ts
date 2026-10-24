import { pendingEmailChange } from '#lib/auth/account/account.ts';
import {
	ATELIER_EMPTY_DEPENDENCY,
	loadAtelierEmpty
} from '#lib/data-transfer/import-data/import-data.ts';
import {
	loadPreferences,
	PREFERENCES_DEPENDENCY
} from '#lib/profile/preferences-data/preferences-data.ts';
import { loadProfile, PROFILE_DEPENDENCY } from '#lib/profile/profile-data/profile-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
	depends(PROFILE_DEPENDENCY, PREFERENCES_DEPENDENCY, ATELIER_EMPTY_DEPENDENCY);
	const [profile, preferences, atelierEmpty, pendingEmail] = await Promise.all([
		loadProfile(),
		loadPreferences(),
		loadAtelierEmpty(),
		pendingEmailChange()
	]);
	return {
		profile: profile.profile,
		preferences: preferences.preferences,
		atelierEmpty,
		pendingEmail,
		error: profile.error ?? preferences.error
	};
};
