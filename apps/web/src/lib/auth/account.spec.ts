import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { signIn, signUp } from './account';

const auth = vi.hoisted(() => ({
	signInWithPassword: vi.fn(),
	signUp: vi.fn()
}));

vi.mock('#lib/supabase.ts', () => ({ supabase: { auth } }));

beforeEach(() => {
	vi.stubGlobal('window', { location: { origin: 'https://atelier.test' } });
	auth.signInWithPassword.mockReset();
	auth.signUp.mockReset();
});

describe('signIn', () => {
	it('returns nothing when Supabase accepts the credentials', async () => {
		auth.signInWithPassword.mockResolvedValue({ error: null });
		expect(await signIn('anna@przyklad.pl', 'vermeer1')).toBeUndefined();
	});

	it('returns the mapped message when Supabase rejects the credentials', async () => {
		auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } });
		expect(await signIn('anna@przyklad.pl', 'wrong')).toBe(m.authErrors.invalidCredentials);
	});
});

describe('signUp', () => {
	it('asks for a confirmation link back to the app', async () => {
		auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
		expect(await signUp('anna@przyklad.pl', 'vermeer1')).toEqual({ signedIn: false });
		expect(auth.signUp).toHaveBeenCalledWith({
			email: 'anna@przyklad.pl',
			password: 'vermeer1',
			options: { emailRedirectTo: 'https://atelier.test/' }
		});
	});

	it('reports a signed-in user when confirmation is off', async () => {
		auth.signUp.mockResolvedValue({ data: { session: {} }, error: null });
		expect(await signUp('anna@przyklad.pl', 'vermeer1')).toEqual({ signedIn: true });
	});
});
