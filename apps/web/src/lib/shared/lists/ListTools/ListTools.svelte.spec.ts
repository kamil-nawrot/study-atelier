import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ListTools from './ListTools.svelte';

const options = [
	{ value: 'name', label: 'Alfabetycznie' },
	{ value: 'recent', label: 'Ostatnio dodane' }
];

const actions = createRawSnippet(() => ({ render: () => '<a href="/a">Dodaj</a>' }));

function boxesOf(): DOMRect[] {
	const row = page.getByRole('link', { name: 'Dodaj' }).element().closest('.tools') as Element;
	return [...row.children].map((child) => child.getBoundingClientRect());
}

describe('ListTools', () => {
	it('offers no order with a single option', async () => {
		render(ListTools, { searchLabel: 'Szukaj', sortLabel: 'Sortuj', options: options.slice(0, 1) });

		await expect.element(page.getByRole('searchbox', { name: 'Szukaj' })).toBeVisible();
		await expect.element(page.getByRole('combobox', { name: 'Sortuj' })).not.toBeInTheDocument();
	});

	it('lets the search fill the row before the order and the actions', async () => {
		await page.viewport(1280, 800);
		render(ListTools, { searchLabel: 'Szukaj', sortLabel: 'Sortuj', options, actions });

		await expect.element(page.getByRole('searchbox', { name: 'Szukaj' })).toBeVisible();
		const boxes = boxesOf();
		expect(boxes).toHaveLength(3);
		expect(boxes[0].width).toBeGreaterThan(boxes[1].width + boxes[2].width);
		expect(boxes[2].left).toBeGreaterThanOrEqual(boxes[1].right);
	});

	it('keeps the actions at the right without a search', async () => {
		await page.viewport(1280, 800);
		render(ListTools, { sortLabel: 'Sortuj', options, actions });

		await expect.element(page.getByRole('link', { name: 'Dodaj' })).toBeVisible();
		await expect.element(page.getByRole('searchbox')).not.toBeInTheDocument();
		const row = page.getByRole('link', { name: 'Dodaj' }).element().closest('.tools') as Element;
		const boxes = boxesOf();
		expect(boxes[1].right).toBeCloseTo(row.getBoundingClientRect().right, 0);
	});
});
