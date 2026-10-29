import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Meter from './Meter.svelte';

describe('Meter', () => {
	it('names the amount and fills the share of the maximum', async () => {
		render(Meter, { value: 50, max: 200, label: '50 MB z 200 MB' });

		const meter = page.getByRole('meter', { name: '50 MB z 200 MB' });
		await expect.element(meter).toHaveAttribute('aria-valuenow', '50');
		await expect.element(meter).toHaveAttribute('aria-valuemax', '200');
		expect(meter.element().querySelector('span')?.style.inlineSize).toBe('25%');
	});

	it('stops filling at the maximum', async () => {
		render(Meter, { value: 250, max: 200, label: 'Ponad limit' });

		const meter = page.getByRole('meter', { name: 'Ponad limit' });
		await expect.element(meter).toHaveAttribute('aria-valuenow', '200');
		expect(meter.element().querySelector('span')?.style.inlineSize).toBe('100%');
	});
});
