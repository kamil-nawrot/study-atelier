import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testDetail } from '#lib/testing/symbols/symbols.ts';
import SymbolDetails from './SymbolDetails.svelte';

describe('SymbolDetails', () => {
	it('links each detail to its pin on the artwork with the title and byline', async () => {
		render(SymbolDetails, { details: [testDetail('pin-1')] });

		const link = page.getByRole('link', { name: /Saint Jerome Writing/ });
		await expect.element(link).toHaveAttribute('href', '/atelier/12?pin=pin-1');
		await expect.element(link).toHaveTextContent('Caravaggio, 1606');
		expect(document.querySelector('.lens')).not.toBeNull();
	});

	it('lists a pin without a view by title, without a lens', async () => {
		render(SymbolDetails, { details: [testDetail('pin-2', { lens: undefined })] });

		await expect.element(page.getByRole('link', { name: /Saint Jerome Writing/ })).toBeVisible();
		expect(document.querySelector('.lens')).toBeNull();
	});

	it('sets a detail as the main one and unsets the current main detail', async () => {
		const onsetcover = vi.fn();
		render(SymbolDetails, {
			details: [testDetail('pin-1'), testDetail('pin-2')],
			coverPinId: 'pin-1',
			onsetcover
		});

		await page.getByRole('button', { name: m.symbols.view.unsetMainDetail }).click();
		await page.getByRole('button', { name: m.symbols.view.setMainDetail }).click();

		expect(onsetcover.mock.calls).toEqual([[null], ['pin-2']]);
	});

	it('keeps many details in one row that scrolls instead of wrapping', async () => {
		await page.viewport(1280, 800);
		render(SymbolDetails, {
			details: Array.from({ length: 12 }, (_, index) => testDetail(`pin-${index}`))
		});

		await expect
			.element(page.getByRole('button', { name: m.symbols.view.detailsForward }))
			.toBeEnabled();
		const tops = new Set([...document.querySelectorAll('li')].map((item) => item.offsetTop));
		expect(tops.size).toBe(1);
	});
});
