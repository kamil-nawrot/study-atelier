import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSymbolPage } from '#lib/testing/symbols/symbols.ts';
import SymbolMeaningSection from './SymbolMeaningSection.svelte';

describe('SymbolMeaningSection', () => {
	it('shows the number, the meaning, its labels and its details', async () => {
		render(SymbolMeaningSection, {
			section: testSymbolPage().sections[1],
			number: 2,
			pinsShown: true
		});

		await expect.element(page.getByRole('heading', { name: /^2 penance/ })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: /Baroque/ }))
			.toHaveTextContent(`Baroque · ${m.symbols.contextKinds.period}`);
		await expect.element(page.getByRole('link', { name: /Saint Jerome Writing/ })).toBeVisible();
	});

	it('says no detail has a meaning yet, unless the details did not load', async () => {
		const shown = await render(SymbolMeaningSection, {
			section: testSymbolPage().sections[0],
			number: 1,
			pinsShown: true
		});
		await expect.element(page.getByText(m.symbols.view.general)).toBeVisible();
		await expect.element(page.getByText(m.symbols.view.noDetails)).toBeVisible();
		shown.unmount();

		render(SymbolMeaningSection, {
			section: testSymbolPage().sections[0],
			number: 1,
			pinsShown: false
		});
		await expect.element(page.getByText(m.symbols.view.noDetails)).not.toBeInTheDocument();
	});

	it('offers editing, assigning details and removing in a menu named after the meaning', async () => {
		const onassign = vi.fn();
		render(SymbolMeaningSection, {
			section: testSymbolPage().sections[1],
			number: 2,
			pinsShown: true,
			onedit: vi.fn(),
			onassign,
			onremove: vi.fn(),
			onmove: vi.fn()
		});

		await page.getByRole('button', { name: m.symbols.meaningDialog.actions('penance') }).click();
		await expect
			.element(page.getByRole('button', { name: m.symbols.meaningDialog.edit }))
			.toBeVisible();
		await page.getByRole('button', { name: m.symbols.meaningDialog.assign }).click();

		expect(onassign).toHaveBeenCalled();
	});

	it('shows arrows instead of the menu while reordering', async () => {
		const onmove = vi.fn();
		render(SymbolMeaningSection, {
			section: testSymbolPage().sections[1],
			number: 2,
			pinsShown: true,
			reordering: true,
			first: true,
			onedit: vi.fn(),
			onassign: vi.fn(),
			onremove: vi.fn(),
			onmove
		});

		await expect
			.element(page.getByRole('button', { name: m.symbols.meaningDialog.moveUp('penance') }))
			.toBeDisabled();
		await page.getByRole('button', { name: m.symbols.meaningDialog.moveDown('penance') }).click();

		expect(onmove).toHaveBeenCalledWith(1);
		await expect
			.element(page.getByRole('button', { name: m.symbols.meaningDialog.actions('penance') }))
			.not.toBeInTheDocument();
	});
});
