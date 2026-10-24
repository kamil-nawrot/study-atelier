import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	apiError,
	networkError,
	pending,
	TEST_EMAIL,
	testSession
} from '#lib/testing/auth/auth.ts';
import SignUpPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signUp: vi.fn() } }
}));

const signUp = vi.mocked(supabase.auth.signUp);

async function submit(email: string, password: string): Promise<void> {
	await page.getByLabelText(m.common.email).fill(email);
	await page.getByLabelText(m.common.password).fill(password);
	await page.getByRole('button', { name: m.signUp.submit }).click();
}

describe('sign-up page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		render(SignUpPage);
	});

	it('shows the password hint and a way back to sign-in', async () => {
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent(m.signUp.title);
		await expect.element(page.getByText(m.validation.passwordHint(8))).toBeVisible();

		await expect
			.element(page.getByRole('link', { name: m.signUp.toSignIn }))
			.toHaveAttribute('href', '/sign-in');
	});

	it('requires an email and a password', async () => {
		await page.getByRole('button', { name: m.signUp.submit }).click();

		await expect.element(page.getByText(m.validation.emailRequired)).toBeVisible();
		await expect.element(page.getByText(m.validation.passwordRequired)).toBeVisible();
		expect(signUp).not.toHaveBeenCalled();
	});

	it('rejects a password shorter than eight characters', async () => {
		await submit(TEST_EMAIL, 'abc');

		await expect.element(page.getByText(m.validation.passwordTooShort(8, 3))).toBeVisible();
		await expect.element(page.getByText(m.validation.passwordHint(8))).not.toBeInTheDocument();
		await expect.element(page.getByLabelText(m.common.password)).toHaveFocus();
		expect(signUp).not.toHaveBeenCalled();
	});

	it('asks the user to confirm the email when no session is returned', async () => {
		signUp.mockResolvedValue({ data: { user: testSession().user, session: null }, error: null });

		await submit(TEST_EMAIL, 'correct-password');

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/sign-up/check-email', { state: { email: TEST_EMAIL } })
		);
		expect(signUp).toHaveBeenCalledWith({
			email: TEST_EMAIL,
			password: 'correct-password',
			options: { emailRedirectTo: `${window.location.origin}/` }
		});
	});

	it('opens the home page when sign-up returns a session', async () => {
		signUp.mockResolvedValue({
			data: { user: testSession().user, session: testSession() },
			error: null
		});

		await submit(TEST_EMAIL, 'correct-password');

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/atelier', { invalidateAll: true }));
		expect(goto).toHaveBeenCalledTimes(1);
	});

	it('points to sign-in and a new password when the account already exists', async () => {
		signUp.mockResolvedValue({
			data: { user: { ...testSession().user, identities: [] }, session: null },
			error: null
		});

		await submit(TEST_EMAIL, 'correct-password');

		const alert = page.getByRole('alert');
		await expect.element(alert).toHaveTextContent(m.signUp.errorTitle);
		await expect.element(alert).toHaveTextContent(m.signUp.accountExists);
		await expect
			.element(alert.getByRole('link', { name: m.signUp.toSignIn }))
			.toHaveAttribute('href', '/sign-in');
		await expect
			.element(alert.getByRole('link', { name: m.signUp.forgotPassword }))
			.toHaveAttribute('href', '/forgot-password');
		await expect.element(page.getByRole('button', { name: m.signUp.submit })).toBeEnabled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('reports an existing account when Supabase returns user_already_exists', async () => {
		signUp.mockResolvedValue({
			data: { user: null, session: null },
			error: apiError('user_already_exists', 422)
		});

		await submit(TEST_EMAIL, 'correct-password');

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.signUp.accountExists);
	});

	it('disables the button while creating the account', async () => {
		signUp.mockReturnValue(pending());

		await submit(TEST_EMAIL, 'correct-password');

		await expect.element(page.getByRole('button', { name: m.signUp.submitting })).toBeDisabled();
	});

	it('explains a weak password', async () => {
		signUp.mockResolvedValue({
			data: { user: null, session: null },
			error: apiError('weak_password', 422)
		});

		await submit(TEST_EMAIL, 'password');

		const alert = page.getByRole('alert');
		await expect.element(alert).toHaveTextContent(m.signUp.errorTitle);
		await expect.element(alert).toHaveTextContent(m.authErrors.weakPassword);
		await expect.element(page.getByRole('button', { name: m.signUp.submit })).toBeEnabled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('reports a network failure', async () => {
		signUp.mockResolvedValue({ data: { user: null, session: null }, error: networkError() });

		await submit(TEST_EMAIL, 'correct-password');

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.authErrors.network);
	});
});
