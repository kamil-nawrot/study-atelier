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

const ownProfileData = vi.hoisted(() => ({
	loadOwnProfile: vi.fn()
}));

vi.mock('#lib/profile/own-profile-data/own-profile-data.ts', () => ({
	loadOwnProfile: ownProfileData.loadOwnProfile
}));

function own(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		preferences: defaultPreferences,
		profile: { displayName: 'Anna', avatarPath: null },
		legalVersion: '2026-10-27',
		...overrides
	};
}

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
		ownProfileData.loadOwnProfile.mockReset();
		ownProfileData.loadOwnProfile.mockResolvedValue(own());
		reviewData.loadReviewCounts.mockResolvedValue({
			counts: { due: 4, newAvailable: 30, newToday: 3, withImage: 40 }
		});
	});

	it('sends a signed-out visitor to sign-in', async () => {
		const error = await Promise.resolve(loadWith(null)).catch((thrown: unknown) => thrown);

		expect(isRedirect(error) && error).toMatchObject({ status: 307, location: '/sign-in' });
		expect(ownProfileData.loadOwnProfile).not.toHaveBeenCalled();
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
		ownProfileData.loadOwnProfile.mockResolvedValue(
			own({ preferences: { ...defaultPreferences, reviewNewPerDay: 20 } })
		);

		const { reviewWaiting } = (await loadWith(testSession())) ?? {};

		await expect(reviewWaiting).resolves.toBe(21);
	});

	it('applies the switches for the automatic fetching before the page shows', async () => {
		ownProfileData.loadOwnProfile.mockResolvedValue(
			own({ preferences: { ...defaultPreferences, fetchImage: false, fetchEvent: false } })
		);

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
		ownProfileData.loadOwnProfile.mockResolvedValue(
			own({ profile: { displayName: null, avatarPath: null }, error: 'Failed' })
		);

		const { menuProfile } = (await loadWith(testSession())) ?? {};

		await expect(menuProfile).resolves.toBeUndefined();
	});

	it('reads the profile row once for the menu, the preferences and the accepted terms', async () => {
		const data = (await loadWith(testSession())) ?? {};

		expect(ownProfileData.loadOwnProfile).toHaveBeenCalledTimes(1);
		expect(data).toMatchObject({ preferences: defaultPreferences });
		await expect(data.acceptedLegalVersion).resolves.toBe('2026-10-27');
	});
});
