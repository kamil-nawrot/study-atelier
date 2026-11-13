import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSymbol, testSymbolPage } from '#lib/testing/symbols/symbols.ts';
import SymbolView from './SymbolView.svelte';

const { setSymbolCover } = vi.hoisted(() => ({ setSymbolCover: vi.fn() }));

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ setSymbolCover }));

beforeEach(() => {
	setSymbolCover.mockReset().mockResolvedValue({});
});

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

	it('marks a detail as the main one with a toast and leaves the mark alone on a second click', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await page.getByRole('button', { name: m.symbols.view.setMainDetail }).first().click();

		expect(setSymbolCover).toHaveBeenCalledWith('skull', expect.any(String));
		await expect.element(page.getByText(m.symbols.view.mainDetailSaved)).toBeVisible();
		await page.getByRole('button', { name: m.symbols.view.mainDetail }).click();
		expect(setSymbolCover).toHaveBeenCalledTimes(1);
	});

	it('says when the main detail could not be saved', async () => {
		setSymbolCover.mockResolvedValue({ error: 'Offline.' });
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await page.getByRole('button', { name: m.symbols.view.setMainDetail }).first().click();

		await expect.element(page.getByText('Offline.')).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.symbols.view.mainDetail }))
			.not.toBeInTheDocument();
	});
});
