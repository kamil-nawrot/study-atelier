import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { auth: { signOut } } }));

import { sessionEnded } from '#lib/auth/expired-session/expired-session.svelte.ts';
import { failureMessage } from './expired-session-data.ts';

describe('failureMessage', () => {
	beforeEach(() => {
		signOut.mockReset();
		sessionEnded.value = false;
	});

	it('maps an ordinary error and keeps the session', async () => {
		const message = await failureMessage({ code: '23505' }, () => 'mapped');

		expect(message).toBe('mapped');
		expect(signOut).not.toHaveBeenCalled();
		expect(sessionEnded.value).toBe(false);
	});

	it('signs the learner out on an authorization error', async () => {
		const message = await failureMessage({ code: 'PGRST301' }, () => 'mapped');

		expect(message).toBe(m.authErrors.sessionEnded);
		expect(signOut).toHaveBeenCalledOnce();
		expect(sessionEnded.value).toBe(true);
	});
});
