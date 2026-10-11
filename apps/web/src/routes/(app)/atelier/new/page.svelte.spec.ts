import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { testSession } from '#lib/testing/auth.ts';
import AddArtworkPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

describe('add artwork page', () => {
	it('says the form is on its way and links back to the atelier', async () => {
		render(AddArtworkPage, { data: { session: testSession() }, params: {} });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.comingSoon.addArtwork);
		await expect.element(page.getByText(m.comingSoon.lead)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.comingSoon.backToAtelier }))
			.toHaveAttribute('href', '/atelier');
	});
});
