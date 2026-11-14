import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testAtlasSymbol } from '#lib/testing/symbols/symbols.ts';
import SymbolAtlas from './SymbolAtlas.svelte';

const symbols = [
	testAtlasSymbol(),
	testAtlasSymbol({ id: 'dove', name: 'Dove', pinCount: 5, createdAt: '2026-10-01T10:00:00Z' })
];

function names(): string[] {
	return [...document.querySelectorAll('.grid .name')].map((name) => name.textContent ?? '');
}

describe('SymbolAtlas', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('lists the symbols by name and sorts them by the number of details', async () => {
		render(SymbolAtlas, { symbols });

		expect(names()).toEqual(['Dove', 'Skull']);
		await page
			.getByRole('combobox', { name: m.symbols.sortLabel })
			.selectOptions(m.symbols.sorts.recent);
		expect(names()).toEqual(['Skull', 'Dove']);
	});

	it('filters by the typed name', async () => {
		render(SymbolAtlas, { symbols });

		await userEvent.fill(page.getByRole('searchbox', { name: m.symbols.search }), 'sku');

		await expect.element(page.getByRole('link', { name: /Dove/ })).not.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /Skull/ })).toBeVisible();
	});

	it('shows the empty atlas and a load failure', async () => {
		const empty = await render(SymbolAtlas, { symbols: [] });
		await expect.element(page.getByText(m.symbols.emptyTitle)).toBeVisible();
		empty.unmount();

		render(SymbolAtlas, { symbols: [], error: 'Offline.' });
		await expect.element(page.getByText('Offline.')).toBeVisible();
	});
});
