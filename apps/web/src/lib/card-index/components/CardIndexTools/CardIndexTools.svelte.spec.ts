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

	it('gives the add buttons the full width of the search on a phone', async () => {
		await page.viewport(390, 800);
		const actions = createRawSnippet(() => ({
			render: () =>
				'<span style="display: contents"><a href="/a">Dodaj okres</a><a href="/b">Dodaj styl</a></span>'
		}));
		render(CardIndexTools, { searchLabel: 'Szukaj', sorts: ['name', 'count'], actions });

		const search = page.getByRole('searchbox').element().closest('.search') as Element;
		const first = page.getByRole('link', { name: 'Dodaj okres' }).element().getBoundingClientRect();
		const second = page.getByRole('link', { name: 'Dodaj styl' }).element().getBoundingClientRect();
		const row = search.getBoundingClientRect();
		expect(first.left).toBeCloseTo(row.left, 0);
		expect(second.right).toBeCloseTo(row.right, 0);
		expect(first.width).toBeCloseTo(second.width, 0);
	});
});
