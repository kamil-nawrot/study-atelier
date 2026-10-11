import { describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { testSession } from '#lib/testing/auth.ts';
import { load } from './+layout';

type LoadEvent = Parameters<typeof load>[0];

function loadWith(session: Session | null): ReturnType<typeof load> {
	return load({ parent: async () => ({ session }) } as unknown as LoadEvent);
}

describe('(app) layout load', () => {
	it('sends a signed-out visitor to sign-in', async () => {
		const error = await Promise.resolve(loadWith(null)).catch((thrown: unknown) => thrown);

		expect(isRedirect(error) && error).toMatchObject({ status: 307, location: '/sign-in' });
	});

	it('passes the session on when signed in', async () => {
		const session = testSession();

		await expect(loadWith(session)).resolves.toEqual({ session });
	});
});
