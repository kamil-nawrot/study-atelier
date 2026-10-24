import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { apiError, networkError, pending, TEST_EMAIL } from '#lib/testing/auth/auth.ts';
import ForgotPasswordPage from './+page.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { resetPasswordForEmail: vi.fn() } }
}));

const resetPasswordForEmail = vi.mocked(supabase.auth.resetPasswordForEmail);

async function submit(email: string): Promise<void> {
	await page.getByLabelText(m.common.email).fill(email);
	await page.getByRole('button', { name: m.forgotPassword.submit }).click();
}

describe('forgot-password page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		render(ForgotPasswordPage);
	});

	it('links back to sign-in', async () => {
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.forgotPassword.title);
		await expect
			.element(page.getByRole('link', { name: m.common.backToSignIn }))
			.toHaveAttribute('href', '/sign-in');
	});

	it('validates the email address', async () => {
		await page.getByRole('button', { name: m.forgotPassword.submit }).click();
		await expect.element(page.getByText(m.validation.emailRequired)).toBeVisible();

		await submit('learner');
		await expect.element(page.getByText(m.validation.emailInvalid)).toBeVisible();

		expect(resetPasswordForEmail).not.toHaveBeenCalled();
	});

	it('sends the link and replaces the form with a confirmation', async () => {
		resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

		await submit(TEST_EMAIL);

		const status = page.getByRole('status');
		await expect.element(status).toHaveTextContent(m.forgotPassword.sentTitle);
		await expect.element(status).toHaveTextContent(m.forgotPassword.sent(TEST_EMAIL));
		await expect.element(page.getByLabelText(m.common.email)).not.toBeInTheDocument();
		expect(resetPasswordForEmail).toHaveBeenCalledWith(TEST_EMAIL, {
			redirectTo: `${window.location.origin}/update-password`
		});
	});

	it('disables the button while sending', async () => {
		resetPasswordForEmail.mockReturnValue(pending());

		await submit(TEST_EMAIL);

		await expect
			.element(page.getByRole('button', { name: m.forgotPassword.submitting }))
			.toBeDisabled();
	});

	it('explains a rate limit and keeps the form', async () => {
		resetPasswordForEmail.mockResolvedValue({
			data: null,
			error: apiError('over_email_send_rate_limit', 429)
		});

		await submit(TEST_EMAIL);

		const alert = page.getByRole('alert');
		await expect.element(alert).toHaveTextContent(m.forgotPassword.errorTitle);
		await expect.element(alert).toHaveTextContent(m.authErrors.emailRateLimited);
		await expect.element(page.getByRole('button', { name: m.forgotPassword.submit })).toBeEnabled();
	});

	it('reports a network failure', async () => {
		resetPasswordForEmail.mockResolvedValue({ data: null, error: networkError() });

		await submit(TEST_EMAIL);

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.authErrors.network);
	});
});
