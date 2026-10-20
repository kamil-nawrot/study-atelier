import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut } } }));

import { failureMessage, isAuthorizationError, sessionEnded } from './expired-session.svelte.ts';

describe('isAuthorizationError', () => {
	it('recognises an invalid or expired token', () => {
		expect(isAuthorizationError({ code: 'PGRST301' })).toBe(true);
		expect(isAuthorizationError({ code: 'PGRST303' })).toBe(true);
		expect(isAuthorizationError({ status: 401 })).toBe(true);
	});

	it('leaves other errors alone', () => {
		expect(isAuthorizationError({ code: '23505' })).toBe(false);
		expect(isAuthorizationError({ code: '42501' })).toBe(false);
	});
});

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
