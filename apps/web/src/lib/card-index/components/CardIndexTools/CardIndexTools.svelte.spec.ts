import { describe, expect, it } from 'vitest';
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
});
