import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { currentSession, watchSession } from './session.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() } }
}));

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

const unsubscribe = vi.fn();
let emit: AuthListener = () => {};

describe('session', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((listener) => {
			emit = listener as AuthListener;
			return {
				data: { subscription: { id: 'subscription', callback: listener, unsubscribe } }
			};
		});
	});

	it('reads the current session', async () => {
		const session = testSession();
		vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session }, error: null });

		await expect(currentSession()).resolves.toBe(session);
	});

	it('returns null when nobody is signed in', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: null },
			error: null
		});

		await expect(currentSession()).resolves.toBeNull();
	});

	it('reports sign-in, sign-out and token changes', () => {
		let current: Session | null = null;
		const onChange = vi.fn();
		watchSession(() => current, onChange);

		emit('SIGNED_IN', testSession('first'));
		current = testSession('first');
		emit('TOKEN_REFRESHED', testSession('second'));
		current = testSession('second');
		emit('SIGNED_OUT', null);

		expect(onChange).toHaveBeenCalledTimes(3);
	});

	it('ignores events that keep the same session', () => {
		const onChange = vi.fn();
		watchSession(() => testSession('same'), onChange);

		emit('INITIAL_SESSION', testSession('same'));
		emit('USER_UPDATED', testSession('same'));

		expect(onChange).not.toHaveBeenCalled();
	});

	it('ignores events without a session while signed out', () => {
		const onChange = vi.fn();
		watchSession(() => null, onChange);

		emit('INITIAL_SESSION', null);

		expect(onChange).not.toHaveBeenCalled();
	});

	it('stops listening when disposed', () => {
		const stop = watchSession(() => null, vi.fn());

		stop();

		expect(unsubscribe).toHaveBeenCalledOnce();
	});
});
