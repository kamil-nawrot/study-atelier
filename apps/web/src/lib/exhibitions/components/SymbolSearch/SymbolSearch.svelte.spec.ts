import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
import SymbolSearch from './SymbolSearch.svelte';

const symbols: SymbolOption[] = [
	{ id: 's1', name: 'Lilia', meanings: [] },
	{ id: 's2', name: 'Czaszka', meanings: [] }
];

describe('SymbolSearch', () => {
	it('lists the symbols from A to Z and picks one on a click', async () => {
		const onpick = vi.fn();
		render(SymbolSearch, { symbols, onpick });

		await expect.element(page.getByText(m.exhibitions.panel.symbolsByName)).toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: 'Czaszka' }));

		expect(onpick).toHaveBeenCalledWith(symbols[1]);
	});

	it('narrows the list to what the learner types and says when nothing matches', async () => {
		render(SymbolSearch, { symbols, onpick: vi.fn() });

		const search = page.getByRole('searchbox', { name: m.exhibitions.panel.searchSymbol });
		await userEvent.fill(search, 'lil');
		await expect.element(page.getByRole('button', { name: 'Czaszka' })).not.toBeInTheDocument();
		await expect.element(page.getByText(m.exhibitions.panel.found(1))).toBeInTheDocument();

		await userEvent.fill(search, 'golab');
		await expect.element(page.getByText(m.exhibitions.panel.noSymbol)).toBeInTheDocument();
	});

	it('starts a drag from a symbol', async () => {
		const ondrag = vi.fn();
		render(SymbolSearch, { symbols, onpick: vi.fn(), ondrag });

		page
			.getByRole('button', { name: 'Lilia' })
			.element()
			.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

		expect(ondrag).toHaveBeenCalledWith(expect.any(PointerEvent), symbols[0]);
	});

	it('says when the atlas is empty and opens the atlas in a new tab', async () => {
		render(SymbolSearch, { symbols: [], onpick: vi.fn() });

		await expect.element(page.getByText(m.exhibitions.panel.noSymbols)).toBeInTheDocument();
		await expect.element(page.getByRole('searchbox')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.exhibitions.panel.browseSymbols }))
			.toHaveAttribute('href', '/atelier/glossary?tab=symbols');
	});
});
