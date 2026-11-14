import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testDetail } from '#lib/testing/symbols/symbols.ts';
import SymbolTimeline from './SymbolTimeline.svelte';

describe('SymbolTimeline', () => {
	it('places the lenses of the details on the axis of years', async () => {
		render(SymbolTimeline, {
			details: [
				testDetail('pin-1'),
				testDetail('pin-2', { title: 'The Ambassadors', year: 1533, number: 3 })
			]
		});

		await expect.element(page.getByRole('heading', { name: m.symbols.view.axis })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: /The Ambassadors/ }))
			.toHaveAttribute('href', '/atelier/3?pin=pin-2');
		expect([...document.querySelectorAll('.year')].map((year) => year.textContent)).toEqual([
			'1500',
			'1600',
			'1700'
		]);
	});

	it('is left out without a dated detail with a lens', async () => {
		render(SymbolTimeline, {
			details: [testDetail('pin-1', { year: null }), testDetail('pin-2', { lens: undefined })]
		});

		await expect
			.element(page.getByRole('heading', { name: m.symbols.view.axis }))
			.not.toBeInTheDocument();
	});
});
