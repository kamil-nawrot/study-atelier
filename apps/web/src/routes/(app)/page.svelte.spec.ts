import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { pending, TEST_EMAIL, testSession } from '#lib/testing/auth.ts';
import HomePage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const signOut = vi.mocked(supabase.auth.signOut);

describe('home page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		render(HomePage, { data: { session: testSession() }, params: {} });
	});

	it('shows who is signed in', async () => {
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent(m.home.title);
		await expect.element(page.getByText(m.home.signedInAs(TEST_EMAIL))).toBeVisible();
	});

	it('signs out and returns to sign-in', async () => {
		signOut.mockResolvedValue({ error: null });

		await page.getByRole('button', { name: m.home.signOut }).click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/sign-in', { invalidateAll: true }));
		expect(signOut).toHaveBeenCalledOnce();
	});

	it('disables the button while signing out', async () => {
		signOut.mockReturnValue(pending());

		await page.getByRole('button', { name: m.home.signOut }).click();

		await expect.element(page.getByRole('button', { name: m.home.signOut })).toBeDisabled();
		expect(goto).not.toHaveBeenCalled();
	});
});
