import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testSymbol } from '#lib/testing/symbols/symbols.ts';
import EditSymbolPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	saveSymbol: vi.fn(),
	searchArtworkContexts: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

describe('edit symbol page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
	});

	it('fills the form with the saved meanings and leads back to the symbol', async () => {
		render(EditSymbolPage, {
			data: { session: testSession(), symbol: testSymbol, candidates: [] },
			params: { id: 'skull' }
		});

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Skull');
		await expect
			.element(page.getByRole('textbox', { name: m.symbols.form.meaning }).first())
			.toHaveValue('transience, death');
		await expect
			.element(page.getByRole('link', { name: m.common.cancel }))
			.toHaveAttribute('href', '/atelier/glossary/symbols/skull');
	});

	it('says when the symbol is gone', async () => {
		render(EditSymbolPage, {
			data: { session: testSession(), candidates: [], notFound: true },
			params: { id: 'gone' }
		});

		await expect.element(page.getByText(m.symbols.view.notFound)).toBeVisible();
	});
});
