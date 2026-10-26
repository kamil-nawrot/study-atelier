import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import FormPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/chronicle'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

describe('new visit page', () => {
	it('names the form and leads back to the chronicle', async () => {
		render(FormPage, {
			data: { session: testSession(), artworks: [], places: [] },
			params: {}
		});

		await expect
			.element(page.getByRole('heading', { level: 1, name: m.chronicle.form.newTitle }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: m.chronicle.back })).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.form.noPlace)).toBeInTheDocument();
	});
});
