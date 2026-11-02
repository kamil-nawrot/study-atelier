import { pendingEmailChange } from '#lib/auth/account-data/account-data.ts';
import {
	ATELIER_EMPTY_DEPENDENCY,
	loadAtelierEmpty
} from '#lib/data-transfer/import-data/import-data.ts';
import { loadStorageUsage } from '#lib/images/storage-usage-data/storage-usage-data.ts';
import { loadOwnProfile } from '#lib/profile/own-profile-data/own-profile-data.ts';
import { PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data/preferences-data.ts';
import { PROFILE_DEPENDENCY } from '#lib/profile/profile-data/profile-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends, parent }) => {
	depends(PROFILE_DEPENDENCY, PREFERENCES_DEPENDENCY, ATELIER_EMPTY_DEPENDENCY);
	const [own, atelierEmpty, pendingEmail, storageUsage] = await Promise.all([
		parent().then((layout) => layout.ownProfile ?? loadOwnProfile()),
		loadAtelierEmpty(),
		pendingEmailChange(),
		loadStorageUsage()
	]);
	return {
		profile: own.profile,
		preferences: own.preferences,
		atelierEmpty,
		pendingEmail,
		storageUsage,
		acceptedLegalVersion: own.legalVersion ?? null,
		error: own.error
	};
};
