import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
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

describe('visit edit page', () => {
	it('opens the visit as it was saved', async () => {
		render(FormPage, {
			data: { session: testSession(), visit: testVisit(), artworks: [], places: [] },
			params: { id: testVisit().id }
		});

		await expect
			.element(page.getByRole('heading', { level: 1, name: m.chronicle.form.editTitle }))
			.toBeInTheDocument();
		await expect.element(page.getByLabelText(m.chronicle.form.day)).toHaveValue('12');
	});

	it('says that the visit does not exist', async () => {
		render(FormPage, {
			data: { session: testSession(), notFound: true, artworks: [], places: [] },
			params: { id: 'unknown' }
		});

		await expect.element(page.getByText(m.chronicle.errors.notFound)).toBeInTheDocument();
	});
});
