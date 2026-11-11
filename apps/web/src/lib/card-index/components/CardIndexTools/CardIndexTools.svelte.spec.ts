import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import CardIndexTools from './CardIndexTools.svelte';

describe('CardIndexTools', () => {
	it('shows the search and the sorts of the tab', async () => {
		render(CardIndexTools, { searchLabel: 'Szukaj autora', sorts: ['name', 'count', 'life'] });

		await expect.element(page.getByRole('searchbox', { name: 'Szukaj autora' })).toBeVisible();
		const select = page.getByRole('combobox', { name: m.cardIndex.sortLabel });
		await expect.element(select).toHaveValue('name');
		expect(
			[...(select.element() as unknown as HTMLSelectElement).options].map(
				(option) => option.textContent
			)
		).toEqual([m.cardIndex.sorts.name, m.cardIndex.sorts.count, m.cardIndex.sorts.life]);
	});

	it('offers no sort when the tab has only the name', async () => {
		render(CardIndexTools, { searchLabel: 'Szukaj materiału', sorts: ['name'] });

		await expect.element(page.getByRole('searchbox')).toBeVisible();
		await expect
			.element(page.getByRole('combobox', { name: m.cardIndex.sortLabel }))
			.not.toBeInTheDocument();
	});

	it('keeps the search, the order and the add button in one row on a phone', async () => {
		await page.viewport(390, 800);
		const actions = createRawSnippet(() => ({ render: () => '<a href="/a">+</a>' }));
		render(CardIndexTools, { searchLabel: 'Szukaj', sorts: ['name', 'count'], actions });

		await expect.element(page.getByRole('link', { name: '+' })).toBeVisible();
		const row = page.getByRole('searchbox').element().closest('.tools') as Element;
		const boxes = [...row.children].map((child) => child.getBoundingClientRect());
		expect(boxes).toHaveLength(3);
		for (const box of boxes) expect(box.top).toBeCloseTo(boxes[0].top, 0);
		expect(boxes[1].left).toBeGreaterThanOrEqual(boxes[0].right);
		expect(boxes[2].left).toBeGreaterThanOrEqual(boxes[1].right);
	});
});
