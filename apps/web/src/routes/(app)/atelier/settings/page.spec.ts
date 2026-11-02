import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadOwnProfile } from '#lib/profile/own-profile-data/own-profile-data.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { load } from './+page';

vi.mock('#lib/profile/own-profile-data/own-profile-data.ts', () => ({ loadOwnProfile: vi.fn() }));
vi.mock('#lib/auth/account-data/account-data.ts', () => ({
	pendingEmailChange: vi.fn(async () => undefined)
}));
vi.mock('#lib/data-transfer/import-data/import-data.ts', () => ({
	ATELIER_EMPTY_DEPENDENCY: 'atelier:empty',
	loadAtelierEmpty: vi.fn(async () => true)
}));
vi.mock('#lib/images/storage-usage-data/storage-usage-data.ts', () => ({
	loadStorageUsage: vi.fn(async () => undefined)
}));

type LoadEvent = Parameters<typeof load>[0];

const own = {
	preferences: defaultPreferences,
	profile: { displayName: 'Anna', avatarPath: null },
	legalVersion: '2026-10-27'
};

function loadWith(ownProfile?: typeof own): ReturnType<typeof load> {
	return load({
		parent: async () => ({ ownProfile }),
		depends: () => undefined
	} as unknown as LoadEvent);
}

describe('settings load', () => {
	beforeEach(() => {
		vi.mocked(loadOwnProfile)
			.mockReset()
			.mockResolvedValue(own as never);
	});

	it('takes the own profile the app layout has read', async () => {
		const data = await loadWith(own);

		expect(loadOwnProfile).not.toHaveBeenCalled();
		expect(data).toMatchObject({ profile: own.profile, acceptedLegalVersion: '2026-10-27' });
	});

	it('reads the own profile itself when the layout has none', async () => {
		await loadWith(undefined);

		expect(loadOwnProfile).toHaveBeenCalledOnce();
	});
});
