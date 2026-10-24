import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { changePassword, pendingEmailChange, requestEmailChange, signIn, signUp } from './account';

const auth = vi.hoisted(() => ({
	signInWithPassword: vi.fn(),
	signUp: vi.fn(),
	updateUser: vi.fn(),
	getUser: vi.fn(),
	signOut: vi.fn()
}));

vi.mock('#lib/supabase.ts', () => ({ supabase: { auth } }));

beforeEach(() => {
	vi.stubGlobal('window', { location: { origin: 'https://atelier.test' } });
	auth.signInWithPassword.mockReset();
	auth.signUp.mockReset();
	auth.updateUser.mockReset();
	auth.getUser.mockReset();
	auth.signOut.mockReset();
});

describe('signIn', () => {
	it('returns nothing when Supabase accepts the credentials', async () => {
		auth.signInWithPassword.mockResolvedValue({ error: null });
		expect(await signIn('learner@example.com', 'vermeer1')).toBeUndefined();
	});

	it('returns the mapped message when Supabase rejects the credentials', async () => {
		auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } });
		expect(await signIn('learner@example.com', 'wrong')).toBe(m.authErrors.invalidCredentials);
	});
});

describe('signUp', () => {
	it('asks for a confirmation link back to the app', async () => {
		auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
		expect(await signUp('learner@example.com', 'vermeer1')).toEqual({ signedIn: false });
		expect(auth.signUp).toHaveBeenCalledWith({
			email: 'learner@example.com',
			password: 'vermeer1',
			options: { emailRedirectTo: 'https://atelier.test/' }
		});
	});

	it('reports a signed-in user when confirmation is off', async () => {
		auth.signUp.mockResolvedValue({ data: { session: {} }, error: null });
		expect(await signUp('learner@example.com', 'vermeer1')).toEqual({ signedIn: true });
	});

	it('reports an existing account when Supabase hides it behind a user without identities', async () => {
		auth.signUp.mockResolvedValue({
			data: { user: { identities: [] }, session: null },
			error: null
		});
		expect(await signUp('learner@example.com', 'vermeer1')).toEqual({
			accountExists: true,
			signedIn: false
		});
	});

	it('reports an existing account when Supabase rejects the email as taken', async () => {
		auth.signUp.mockResolvedValue({
			data: { user: null, session: null },
			error: { code: 'user_already_exists', status: 422 }
		});
		expect(await signUp('learner@example.com', 'vermeer1')).toEqual({
			accountExists: true,
			signedIn: false
		});
	});
});

describe('changePassword', () => {
	beforeEach(() => {
		auth.signInWithPassword.mockResolvedValue({ error: null });
		auth.updateUser.mockResolvedValue({ error: null });
		auth.signOut.mockResolvedValue({ error: null });
	});

	it('checks the current password by signing in with it before setting the new one', async () => {
		const result = await changePassword('learner@example.com', 'vermeer1', 'rembrandt2', false);

		expect(result).toEqual({ changed: true });
		expect(auth.signInWithPassword).toHaveBeenCalledWith({
			email: 'learner@example.com',
			password: 'vermeer1'
		});
		expect(auth.updateUser).toHaveBeenCalledWith({ password: 'rembrandt2' });
		expect(auth.signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(
			auth.updateUser.mock.invocationCallOrder[0]
		);
	});

	it('signs out the other devices only when asked to', async () => {
		await changePassword('learner@example.com', 'vermeer1', 'rembrandt2', false);
		expect(auth.signOut).not.toHaveBeenCalled();

		await changePassword('learner@example.com', 'vermeer1', 'rembrandt2', true);
		expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'others' });
	});

	it('says when the other devices could not be signed out after the change', async () => {
		auth.signOut.mockResolvedValue({ error: { status: 500 } });

		const result = await changePassword('learner@example.com', 'vermeer1', 'rembrandt2', true);

		expect(result).toEqual({ changed: true, othersError: m.settings.account.othersFailed });
	});

	it('reports a wrong current password under that field and changes nothing', async () => {
		auth.signInWithPassword.mockResolvedValue({
			error: { code: 'invalid_credentials', status: 400 }
		});

		const result = await changePassword('learner@example.com', 'wrong', 'rembrandt2', true);

		expect(result).toEqual({ changed: false, currentError: m.settings.account.wrongCurrent });
		expect(auth.updateUser).not.toHaveBeenCalled();
		expect(auth.signOut).not.toHaveBeenCalled();
	});

	it('does not sign anyone out when the server refuses the check with an authorization error', async () => {
		auth.signInWithPassword.mockResolvedValue({
			error: { code: 'invalid_credentials', status: 401 }
		});

		const result = await changePassword('learner@example.com', 'wrong', 'rembrandt2', true);

		expect(result.currentError).toBe(m.settings.account.wrongCurrent);
		expect(auth.signOut).not.toHaveBeenCalled();
	});

	it('rejects a new password equal to the current one without calling the server', async () => {
		const result = await changePassword('learner@example.com', 'vermeer1', 'vermeer1', true);

		expect(result).toEqual({ changed: false, newError: m.settings.account.sameAsCurrent });
		expect(auth.signInWithPassword).not.toHaveBeenCalled();
	});

	it('reports a password the server calls the same under the new password field', async () => {
		auth.updateUser.mockResolvedValue({ error: { code: 'same_password', status: 422 } });

		const result = await changePassword('learner@example.com', 'vermeer1', 'rembrandt2', true);

		expect(result).toEqual({ changed: false, newError: m.settings.account.sameAsCurrent });
		expect(auth.signOut).not.toHaveBeenCalled();
	});

	it('reports a weak password under the new password field', async () => {
		auth.updateUser.mockResolvedValue({ error: { code: 'weak_password', status: 422 } });

		const result = await changePassword('learner@example.com', 'vermeer1', 'rembrandt2', true);

		expect(result).toEqual({ changed: false, newError: m.authErrors.weakPassword });
	});

	it('shows a general message when the network fails and keeps the session', async () => {
		auth.signInWithPassword.mockResolvedValue({ error: { name: 'AuthRetryableFetchError' } });

		const result = await changePassword('learner@example.com', 'vermeer1', 'rembrandt2', true);

		expect(result).toEqual({ changed: false, error: m.authErrors.network });
		expect(auth.signOut).not.toHaveBeenCalled();
	});
});

describe('requestEmailChange', () => {
	it('asks for links that return to the account tab', async () => {
		auth.updateUser.mockResolvedValue({ error: null });
		expect(await requestEmailChange('learner@example.com', ' new@example.com ')).toEqual({
			sent: true
		});
		expect(auth.updateUser).toHaveBeenCalledWith(
			{ email: 'new@example.com' },
			{ emailRedirectTo: 'https://atelier.test/atelier/settings?tab=account&emailChanged=1' }
		);
	});

	it('refuses the current address without calling the server', async () => {
		expect(await requestEmailChange('learner@example.com', 'Learner@Example.com')).toEqual({
			sent: false,
			error: m.settings.account.sameEmail
		});
		expect(auth.updateUser).not.toHaveBeenCalled();
	});

	it('says that the address belongs to another account', async () => {
		auth.updateUser.mockResolvedValue({ error: { code: 'email_exists', status: 422 } });
		expect(await requestEmailChange('learner@example.com', 'taken@example.com')).toEqual({
			sent: false,
			error: m.authErrors.emailTaken
		});
	});
});

describe('pendingEmailChange', () => {
	it('returns the address that waits for confirmation', async () => {
		auth.getUser.mockResolvedValue({
			data: { user: { new_email: 'new@example.com' } },
			error: null
		});
		expect(await pendingEmailChange()).toBe('new@example.com');
	});

	it('returns nothing without a pending change or when the user cannot be read', async () => {
		auth.getUser.mockResolvedValue({ data: { user: {} }, error: null });
		expect(await pendingEmailChange()).toBeUndefined();
		auth.getUser.mockResolvedValue({ data: { user: null }, error: { code: 'x' } });
		expect(await pendingEmailChange()).toBeUndefined();
	});
});
