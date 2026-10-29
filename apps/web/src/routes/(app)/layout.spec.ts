import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { load } from './+layout';

const reviewData = vi.hoisted(() => ({
	loadReviewCounts: vi.fn()
}));

const preferencesData = vi.hoisted(() => ({
	loadPreferences: vi.fn()
}));

const profileData = vi.hoisted(() => ({
	loadProfile: vi.fn()
}));

vi.mock('#lib/profile/preferences-data/preferences-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/profile/preferences-data/preferences-data.ts')>()),
	loadPreferences: preferencesData.loadPreferences
}));

vi.mock('#lib/profile/profile-data/profile-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/profile/profile-data/profile-data.ts')>()),
	loadProfile: profileData.loadProfile
}));

vi.mock('#lib/review/review-data/review-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/review/review-data/review-data.ts')>()),
	loadReviewCounts: reviewData.loadReviewCounts
}));

type LoadEvent = Parameters<typeof load>[0];

function loadWith(session: Session | null): ReturnType<typeof load> {
	return load({
		parent: async () => ({ session }),
		depends: () => undefined
	} as unknown as LoadEvent);
}

describe('(app) layout load', () => {
	beforeEach(() => {
		preferencesData.loadPreferences.mockClear();
		profileData.loadProfile.mockResolvedValue({
			profile: { displayName: 'Anna', avatarPath: null }
		});
		preferencesData.loadPreferences.mockResolvedValue({ preferences: defaultPreferences });
		reviewData.loadReviewCounts.mockResolvedValue({
			counts: { due: 4, newAvailable: 30, newToday: 3, withImage: 40 }
		});
	});

	it('sends a signed-out visitor to sign-in', async () => {
		const error = await Promise.resolve(loadWith(null)).catch((thrown: unknown) => thrown);

		expect(isRedirect(error) && error).toMatchObject({ status: 307, location: '/sign-in' });
		expect(preferencesData.loadPreferences).not.toHaveBeenCalled();
	});

	it('passes the session on when signed in', async () => {
		const session = testSession();

		await expect(loadWith(session)).resolves.toMatchObject({ session });
	});

	it('counts the artworks waiting for review today without holding the page', async () => {
		const { reviewWaiting } = (await loadWith(testSession())) ?? {};

		await expect(reviewWaiting).resolves.toBe(11);
	});

	it('counts the new artworks up to the limit of the preferences', async () => {
		preferencesData.loadPreferences.mockResolvedValue({
			preferences: { ...defaultPreferences, reviewNewPerDay: 20 }
		});

		const { reviewWaiting } = (await loadWith(testSession())) ?? {};

		await expect(reviewWaiting).resolves.toBe(21);
	});

	it('applies the switches for the automatic fetching before the page shows', async () => {
		preferencesData.loadPreferences.mockResolvedValue({
			preferences: { ...defaultPreferences, fetchImage: false, fetchEvent: false }
		});

		await loadWith(testSession());

		expect(autoFetch).toEqual({ image: false, definition: true, forms: true, event: false });
		Object.assign(autoFetch, { image: true, event: true });
	});

	it('shows no counter when the counts cannot be read', async () => {
		reviewData.loadReviewCounts.mockResolvedValue({ error: 'Failed' });

		const { reviewWaiting } = (await loadWith(testSession())) ?? {};

		await expect(reviewWaiting).resolves.toBe(0);
	});

	it('reads the name and the photo for the menu without holding the page', async () => {
		const { menuProfile } = (await loadWith(testSession())) ?? {};

		await expect(menuProfile).resolves.toEqual({ displayName: 'Anna', avatarPath: null });
	});

	it('shows the email in the menu when the profile cannot be read', async () => {
		profileData.loadProfile.mockResolvedValue({
			profile: { displayName: null, avatarPath: null },
			error: 'Failed'
		});

		const { menuProfile } = (await loadWith(testSession())) ?? {};

		await expect(menuProfile).resolves.toBeUndefined();
	});
});
