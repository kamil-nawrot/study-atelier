import { describe, expect, it, vi } from 'vitest';
import { SESSION_DEPENDENCY } from '#lib/auth/session/session.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { load } from './+layout';

vi.mock('#lib/auth/session/session.ts', () => ({
	SESSION_DEPENDENCY: 'supabase:auth',
	currentSession: vi.fn(async () => testSession())
}));

type LoadEvent = Parameters<typeof load>[0];

describe('root layout load', () => {
	it('returns the current session and reloads when it changes', async () => {
		const depends = vi.fn();

		const data = await load({ depends } as unknown as LoadEvent);

		expect(data).toEqual({ session: testSession() });
		expect(depends).toHaveBeenCalledWith(SESSION_DEPENDENCY);
	});
});
