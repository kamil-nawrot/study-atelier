import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import NewSymbolPage from './+page.svelte';

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

describe('new symbol page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
	});

	it('opens an empty form with one meaning', async () => {
		render(NewSymbolPage, {
			data: { session: testSession(), candidates: [] },
			params: {}
		});

		await expect
			.element(page.getByRole('heading', { name: m.symbols.form.newTitle }))
			.toBeInTheDocument();
		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('');
		await expect
			.element(page.getByRole('textbox', { name: m.symbols.form.meaning }))
			.toHaveValue('');
	});
});
