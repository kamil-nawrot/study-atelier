import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { testSession } from '#lib/testing/auth.ts';
import { load } from './+layout';

const reviewData = vi.hoisted(() => ({
	loadReviewCounts: vi.fn()
}));

vi.mock('#lib/review/review-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/review/review-data.ts')>()),
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
		reviewData.loadReviewCounts.mockResolvedValue({
			counts: { due: 4, newAvailable: 30, newToday: 3, withImage: 40 }
		});
	});

	it('sends a signed-out visitor to sign-in', async () => {
		const error = await Promise.resolve(loadWith(null)).catch((thrown: unknown) => thrown);

		expect(isRedirect(error) && error).toMatchObject({ status: 307, location: '/sign-in' });
	});

	it('passes the session on when signed in', async () => {
		const session = testSession();

		await expect(loadWith(session)).resolves.toMatchObject({ session });
	});

	it('counts the artworks waiting for review today without holding the page', async () => {
		const { reviewWaiting } = (await loadWith(testSession())) ?? {};

		await expect(reviewWaiting).resolves.toBe(11);
	});

	it('shows no counter when the counts cannot be read', async () => {
		reviewData.loadReviewCounts.mockResolvedValue({ error: 'Failed' });

		const { reviewWaiting } = (await loadWith(testSession())) ?? {};

		await expect(reviewWaiting).resolves.toBe(0);
	});
});
