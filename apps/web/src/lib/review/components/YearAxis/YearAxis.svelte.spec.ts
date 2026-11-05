import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import YearAxis from './YearAxis.svelte';

describe('YearAxis', () => {
	it('labels the guess over the axis, the real years under it and the ends of the era', async () => {
		render(YearAxis, {
			bounds: [1492, 1789],
			years: [1503, 1519],
			yearsText: '1503–1519',
			guess: 1540
		});

		await expect.element(page.getByText('1540')).toBeInTheDocument();
		await expect.element(page.getByText('1503–1519')).toBeInTheDocument();
		await expect.element(page.getByText('1492')).toBeInTheDocument();
		await expect.element(page.getByText('1789')).toBeInTheDocument();
	});
});
