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

export type OwnProfileResult = {
	preferences: Preferences;
	profile: Profile;
	legalVersion: string | null | undefined;
	eraBounds: number[] | null;
	nightLightRecorded: boolean;
	longLookRecorded: boolean;
	error?: string;
};

const COLUMNS =
	`${PREFERENCES_COLUMNS}, ${PROFILE_COLUMNS}, legal_version, era_bounds, night_light_at, long_look_at` as const;

export async function loadOwnProfile(): Promise<OwnProfileResult> {
	const { data, error } = await supabase.from('profiles').select(COLUMNS).maybeSingle();
	if (error) {
		return {
			preferences: defaultPreferences,
			profile: emptyProfile,
			legalVersion: undefined,
			eraBounds: null,
			nightLightRecorded: false,
			longLookRecorded: false,
			error: profileErrorMessage(error)
		};
	}
	return {
		preferences: preferencesOf(data),
		profile: profileOf(data),
		legalVersion: data?.legal_version ?? null,
		eraBounds: data?.era_bounds ?? null,
		nightLightRecorded: Boolean(data?.night_light_at),
		longLookRecorded: Boolean(data?.long_look_at)
	};
}
