import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { apiError, pending, TEST_EMAIL } from '#lib/testing/auth.ts';
import CheckEmailPage from './+page.svelte';

const navigation = vi.hoisted(() => ({ state: {} as App.PageState }));

vi.mock('$app/state', () => ({ page: navigation }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { resend: vi.fn() } }
}));

const resend = vi.mocked(supabase.auth.resend);

describe('check-email page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		navigation.state = { email: TEST_EMAIL };
	});

	it('names the address the link was sent to', async () => {
		render(CheckEmailPage);

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.checkEmail.title);
		await expect.element(page.getByText(m.checkEmail.sent(TEST_EMAIL))).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.common.backToSignIn }))
			.toHaveAttribute('href', '/sign-in');
	});

	it('resends the link and confirms it', async () => {
		resend.mockResolvedValue({ data: { user: null, session: null }, error: null });
		render(CheckEmailPage);

		await page.getByRole('button', { name: m.checkEmail.resend }).click();

		await expect.element(page.getByText(m.checkEmail.resent)).toBeVisible();
		expect(resend).toHaveBeenCalledWith({
			type: 'signup',
			email: TEST_EMAIL,
			options: { emailRedirectTo: `${window.location.origin}/` }
		});
	});

	it('disables the button while resending', async () => {
		resend.mockReturnValue(pending());
		render(CheckEmailPage);

		await page.getByRole('button', { name: m.checkEmail.resend }).click();

		await expect.element(page.getByRole('button', { name: m.checkEmail.resending })).toBeDisabled();
	});

	it('explains why the link could not be resent', async () => {
		resend.mockResolvedValue({
			data: { user: null, session: null },
			error: apiError('over_email_send_rate_limit', 429)
		});
		render(CheckEmailPage);

		await page.getByRole('button', { name: m.checkEmail.resend }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.authErrors.emailRateLimited);
		await expect.element(page.getByText(m.checkEmail.resent)).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.checkEmail.resend })).toBeEnabled();
	});

	it('shows a generic message without resending when the address is unknown', async () => {
		navigation.state = {};
		render(CheckEmailPage);

		await expect.element(page.getByText(m.checkEmail.sentNoEmail)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.checkEmail.resend }))
			.not.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: m.common.backToSignIn })).toBeVisible();
	});
});
