import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { apiError, networkError, pending, TEST_EMAIL, testSession } from '#lib/testing/auth.ts';
import SignInPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({
	supabase: { auth: { signInWithPassword: vi.fn() } }
}));

const signInWithPassword = vi.mocked(supabase.auth.signInWithPassword);

async function submit(email: string, password: string): Promise<void> {
	await page.getByLabelText(m.common.email).fill(email);
	await page.getByLabelText(m.common.password).fill(password);
	await page.getByRole('button', { name: m.signIn.submit }).click();
}

describe('sign-in page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		render(SignInPage);
	});

	it('shows the title and links to the other auth pages', async () => {
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent(m.signIn.title);
		await expect
			.element(page.getByRole('link', { name: m.signIn.forgotPassword }))
			.toHaveAttribute('href', '/forgot-password');
		await expect
			.element(page.getByRole('link', { name: m.signIn.toSignUp }))
			.toHaveAttribute('href', '/sign-up');
	});

	it('requires an email and a password', async () => {
		await page.getByRole('button', { name: m.signIn.submit }).click();

		await expect.element(page.getByText(m.validation.emailRequired)).toBeVisible();
		await expect.element(page.getByText(m.validation.passwordRequired)).toBeVisible();
		await expect
			.element(page.getByLabelText(m.common.email))
			.toHaveAttribute('aria-invalid', 'true');
		expect(signInWithPassword).not.toHaveBeenCalled();
	});

	it('rejects an incomplete email address', async () => {
		await submit('learner@example', 'correct-password');

		await expect.element(page.getByText(m.validation.emailInvalid)).toBeVisible();
		await expect.element(page.getByLabelText(m.common.email)).toHaveFocus();
		expect(signInWithPassword).not.toHaveBeenCalled();
	});

	it('signs in and opens the home page', async () => {
		signInWithPassword.mockResolvedValue({
			data: { user: testSession().user, session: testSession() },
			error: null
		});

		await submit(TEST_EMAIL, 'correct-password');

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/', { invalidateAll: true }));
		expect(signInWithPassword).toHaveBeenCalledWith({
			email: TEST_EMAIL,
			password: 'correct-password'
		});
	});

	it('disables the button while signing in', async () => {
		signInWithPassword.mockReturnValue(pending());

		await submit(TEST_EMAIL, 'correct-password');

		await expect.element(page.getByRole('button', { name: m.signIn.submitting })).toBeDisabled();
	});

	it('explains wrong credentials and lets the user try again', async () => {
		signInWithPassword.mockResolvedValue({
			data: { user: null, session: null },
			error: apiError('invalid_credentials')
		});

		await submit(TEST_EMAIL, 'wrong-password');

		const alert = page.getByRole('alert');
		await expect.element(alert).toHaveTextContent(m.signIn.errorTitle);
		await expect.element(alert).toHaveTextContent(m.authErrors.invalidCredentials);
		await expect.element(page.getByRole('button', { name: m.signIn.submit })).toBeEnabled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('reports a network failure', async () => {
		signInWithPassword.mockResolvedValue({
			data: { user: null, session: null },
			error: networkError()
		});

		await submit(TEST_EMAIL, 'correct-password');

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.authErrors.network);
	});

	it('clears the previous error on the next attempt', async () => {
		signInWithPassword.mockResolvedValueOnce({
			data: { user: null, session: null },
			error: apiError('invalid_credentials')
		});
		await submit(TEST_EMAIL, 'wrong-password');
		await expect.element(page.getByRole('alert')).toBeVisible();

		await page.getByLabelText(m.common.password).fill('');
		await page.getByRole('button', { name: m.signIn.submit }).click();

		await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.validation.passwordRequired)).toBeVisible();
	});
});
