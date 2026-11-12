import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSymbol, testSymbolPage } from '#lib/testing/symbols/symbols.ts';
import SymbolView from './SymbolView.svelte';

describe('SymbolView', () => {
	it('shows the name, every meaning, the details without a meaning and the axis', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await expect.element(page.getByRole('heading', { level: 1, name: 'Skull' })).toBeVisible();
		await expect.element(page.getByText(m.symbols.view.overline)).toBeVisible();
		await expect.element(page.getByRole('heading', { name: '1 transience, death' })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: '2 penance' })).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.symbols.view.withoutMeaning }))
			.toBeVisible();
		await expect.element(page.getByRole('heading', { name: m.symbols.view.axis })).toBeVisible();
	});

	it('warns when the details did not load', async () => {
		render(SymbolView, {
			symbol: testSymbol,
			page: testSymbolPage({ details: [], withoutMeaning: [], detailsError: 'Offline.' })
		});

		await expect.element(page.getByText('Offline.')).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.symbols.view.withoutMeaning }))
			.not.toBeInTheDocument();
	});
});
