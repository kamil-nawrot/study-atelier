import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testSymbolPage } from '#lib/testing/symbols/symbols.ts';
import type { SymbolPageResult } from '#lib/symbols/types/symbol-page-result.ts';
import SymbolPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/glossary/symbols/skull'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	deleteSymbol: vi.fn(),
	saveSymbol: vi.fn(),
	searchArtworkContexts: vi.fn(),
	setPinMeaning: vi.fn(),
	setSymbolCover: vi.fn()
}));
vi.mock('#lib/symbols/symbol-page-data/symbol-page-data.ts', () => ({
	loadSymbolForm: vi.fn().mockResolvedValue({ candidates: [] })
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

function renderSymbol(data: SymbolPageResult = testSymbolPage()): void {
	render(SymbolPage, { data: { session: testSession(), ...data }, params: { id: 'skull' } });
}

describe('symbol page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		await page.viewport(1280, 800);
	});

	it('shows the symbol with a link to edit it', async () => {
		renderSymbol();

		await expect.element(page.getByRole('heading', { level: 1, name: 'Skull' })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.common.edit }))
			.toHaveAttribute('href', '/atelier/glossary/symbols/skull/edit');
	});

	it('adds a meaning from the top bar', async () => {
		renderSymbol();

		await page.getByRole('button', { name: m.symbols.meaningDialog.add }).click();

		await expect
			.element(page.getByRole('heading', { name: m.symbols.meaningDialog.newTitle }))
			.toBeVisible();
	});

	it('asks before deleting the symbol', async () => {
		renderSymbol();

		await page.getByRole('button', { name: m.common.delete }).first().click();

		await expect
			.element(page.getByRole('heading', { name: m.symbols.deleteConfirm.title('Skull') }))
			.toBeVisible();
	});

	it('shows the message of a save and clears it from the address', async () => {
		navigation.state = { glossaryMessage: m.symbols.view.saved('Skull') };
		renderSymbol();

		await expect.element(page.getByText(m.symbols.view.saved('Skull'))).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/glossary/symbols/skull', {
			state: {},
			shallow: true,
			replace: true
		});
	});

	it('says when the symbol is gone', async () => {
		renderSymbol({ notFound: true, sections: [], withoutMeaning: [], details: [] });

		await expect.element(page.getByText(m.symbols.view.notFound)).toBeVisible();
		await expect.element(page.getByRole('link', { name: m.common.edit })).not.toBeInTheDocument();
	});
});
