import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
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

	it('fills in the gold of the display case with the gold tone', async () => {
		render(Meter, { value: 50, max: 100, label: 'Znawca', tone: 'gold' });

		const fill = page.getByRole('meter', { name: 'Znawca' }).element().querySelector('span');
		const gold = document.body.appendChild(document.createElement('span'));
		gold.style.backgroundColor = 'var(--color-case-gold)';
		expect(fill && getComputedStyle(fill).backgroundColor).toBe(
			getComputedStyle(gold).backgroundColor
		);
		gold.remove();
	});

	it('lays a dim track under the fill when asked', async () => {
		render(Meter, { value: 50, max: 100, label: 'Dzieła', track: 'dim' });

		const meter = page.getByRole('meter', { name: 'Dzieła' }).element();
		const tag = document.body.appendChild(document.createElement('span'));
		tag.style.backgroundColor = 'var(--color-tag)';
		expect(getComputedStyle(meter).backgroundColor).toBe(getComputedStyle(tag).backgroundColor);
		tag.remove();
	});
});
