import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SymbolUses from './SymbolUses.svelte';

describe('SymbolUses', () => {
	it('links each symbol with the meaning that carries the label', async () => {
		render(SymbolUses, {
			title: 'Atrybuty postaci',
			uses: [{ symbolId: 'keys', name: 'Keys', meaning: 'Power of the Church' }]
		});

		await expect.element(page.getByText('Atrybuty postaci')).toBeVisible();
		const link = page.getByRole('link', { name: 'Keys' });
		await expect.element(link).toHaveAttribute('href', '/atelier/glossary/symbols/keys');
		await expect.element(page.getByText('Power of the Church')).toBeVisible();
	});

	it('shows nothing without symbols', async () => {
		render(SymbolUses, { title: 'Atrybuty postaci', uses: [] });

		expect(document.querySelector('section')).toBeNull();
	});
});
