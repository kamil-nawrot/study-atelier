import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { profileErrorMessage } from '#lib/profile/errors/errors.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import {
	PREFERENCES_COLUMNS,
	preferencesOf
} from '#lib/profile/preferences-data/preferences-data.ts';
import { emptyProfile } from '#lib/profile/profile/profile.ts';
import { PROFILE_COLUMNS, profileOf } from '#lib/profile/profile-data/profile-data.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { Profile } from '#lib/profile/types/profile.ts';

type OwnProfileResult = {
	preferences: Preferences;
	profile: Profile;
	legalVersion: string | null | undefined;
	error?: string;
};

const COLUMNS = `${PREFERENCES_COLUMNS}, ${PROFILE_COLUMNS}, legal_version` as const;

export async function loadOwnProfile(): Promise<OwnProfileResult> {
	const { data, error } = await supabase.from('profiles').select(COLUMNS).maybeSingle();
	if (error) {
		return {
			preferences: defaultPreferences,
			profile: emptyProfile,
			legalVersion: undefined,
			error: profileErrorMessage(error)
		};
	}
	return {
		preferences: preferencesOf(data),
		profile: profileOf(data),
		legalVersion: data?.legal_version ?? null
	};
}
