import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { Session } from '@supabase/supabase-js';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { apiError, networkError, pending, testSession } from '#lib/testing/auth/auth.ts';
import UpdatePasswordPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { updateUser: vi.fn() } }
}));

const updateUser = vi.mocked(supabase.auth.updateUser);

function renderPage(session: Session | null): void {
	render(UpdatePasswordPage, { data: { session }, params: {} });
}

async function submit(password: string): Promise<void> {
	await page.getByLabelText(m.updatePassword.newPassword).fill(password);
	await page.getByRole('button', { name: m.updatePassword.submit }).click();
}

describe('update-password page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('without a session', () => {
		beforeEach(() => {
			renderPage(null);
		});

		it('says the link has expired and offers a new one', async () => {
			const status = page.getByRole('status');
			await expect.element(status).toHaveTextContent(m.updatePassword.expiredTitle);
			await expect.element(status).toHaveTextContent(m.updatePassword.expired);
			await expect
				.element(page.getByLabelText(m.updatePassword.newPassword))
				.not.toBeInTheDocument();

			await expect
				.element(page.getByRole('link', { name: m.updatePassword.requestNew }))
				.toHaveAttribute('href', '/forgot-password');
		});

		it('links back to sign-in', async () => {
			await expect
				.element(page.getByRole('link', { name: m.common.backToSignIn }))
				.toHaveAttribute('href', '/sign-in');
		});
	});

	describe('with a session from the reset link', () => {
		beforeEach(() => {
			renderPage(testSession());
		});

		it('validates the new password', async () => {
			await page.getByRole('button', { name: m.updatePassword.submit }).click();
			await expect.element(page.getByText(m.validation.passwordRequired)).toBeVisible();

			await submit('short12');
			await expect.element(page.getByText(m.validation.passwordTooShort(8))).toBeVisible();

			expect(updateUser).not.toHaveBeenCalled();
		});

		it('saves the password and opens the home page', async () => {
			updateUser.mockResolvedValue({ data: { user: testSession().user }, error: null });

			await submit('new-password-123');

			await vi.waitFor(() =>
				expect(goto).toHaveBeenCalledWith('/atelier', { invalidateAll: true })
			);
			expect(updateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
		});

		it('disables the button while saving', async () => {
			updateUser.mockReturnValue(pending());

			await submit('new-password-123');

			await expect
				.element(page.getByRole('button', { name: m.updatePassword.submitting }))
				.toBeDisabled();
		});

		it('explains that the new password must differ from the old one', async () => {
			updateUser.mockResolvedValue({
				data: { user: null },
				error: apiError('same_password', 422)
			});

			await submit('old-password-123');

			const alert = page.getByRole('alert');
			await expect.element(alert).toHaveTextContent(m.updatePassword.errorTitle);
			await expect.element(alert).toHaveTextContent(m.authErrors.samePassword);
			await expect
				.element(page.getByRole('button', { name: m.updatePassword.submit }))
				.toBeEnabled();
			expect(goto).not.toHaveBeenCalled();
		});

		it('reports a network failure', async () => {
			updateUser.mockResolvedValue({ data: { user: null }, error: networkError() });

			await submit('new-password-123');

			await expect.element(page.getByRole('alert')).toHaveTextContent(m.authErrors.network);
		});
	});
});
