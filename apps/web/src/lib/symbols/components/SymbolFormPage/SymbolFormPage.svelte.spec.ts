import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { saveSymbol } from '#lib/symbols/symbols-data/symbols-data.ts';
import { testSymbol } from '#lib/testing/symbols/symbols.ts';
import SymbolFormPage from './SymbolFormPage.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	saveSymbol: vi.fn(),
	searchArtworkContexts: vi.fn()
}));

describe('SymbolFormPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('opens the saved symbol with a message', async () => {
		vi.mocked(saveSymbol).mockResolvedValue({ id: 'skull' });
		render(SymbolFormPage, {
			data: { symbol: testSymbol, candidates: [] },
			backPath: '/atelier/glossary/symbols/skull'
		});

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Skull');
		await page.getByRole('button', { name: m.common.save, exact: true }).click();

		expect(goto).toHaveBeenCalledWith('/atelier/glossary/symbols/skull', {
			replace: true,
			refreshAll: true,
			state: { glossaryMessage: m.symbols.view.saved('Skull') }
		});
	});

	it('says when the symbol is gone or did not load', async () => {
		const gone = await render(SymbolFormPage, {
			data: { candidates: [], notFound: true },
			backPath: '/atelier/glossary'
		});
		await expect.element(page.getByText(m.symbols.view.notFound)).toBeVisible();
		gone.unmount();

		render(SymbolFormPage, {
			data: { candidates: [], error: 'Offline.' },
			backPath: '/atelier/glossary'
		});
		await expect.element(page.getByText('Offline.')).toBeVisible();
	});
});
