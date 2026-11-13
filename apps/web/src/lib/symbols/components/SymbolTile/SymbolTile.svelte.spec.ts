import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testAtlasSymbol } from '#lib/testing/symbols/symbols.ts';
import SymbolTile from './SymbolTile.svelte';

describe('SymbolTile', () => {
	it('links to the symbol and shows its lens and counts but no meaning', async () => {
		render(SymbolTile, { symbol: testAtlasSymbol() });

		const link = page.getByRole('link', { name: /Skull/ });
		await expect.element(link).toHaveAttribute('href', '/atelier/glossary/symbols/skull');
		await expect
			.element(link)
			.toHaveTextContent(`${m.symbols.details(3)} · ${m.symbols.meanings(2)}`);
		expect(document.querySelector('.lens img')).not.toBeNull();
		expect(document.querySelector('.meta-line')).not.toBeNull();
		expect(document.querySelector('.meaning')).toBeNull();
	});

	it('shows an empty lens for a symbol without details or meanings', async () => {
		render(SymbolTile, {
			symbol: testAtlasSymbol({
				cover: undefined,
				pinCount: 0,
				meaningCount: 0
			})
		});

		await expect
			.element(page.getByRole('link', { name: /Skull/ }))
			.toHaveTextContent(`${m.symbols.details(0)} · ${m.symbols.meanings(0)}`);
		expect(document.querySelector('.lens img')).toBeNull();
	});
});
