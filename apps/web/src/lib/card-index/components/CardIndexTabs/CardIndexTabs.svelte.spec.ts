import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import CardIndexTabs from './CardIndexTabs.svelte';

function renderTabs(tab: string, index: CardIndexData = testCardIndex()): void {
	render(CardIndexTabs, {
		props: { index, events: [], ownFields: [], tab, query: '', onmessage: () => undefined }
	});
}

function withValues(...values: CardIndexData['values']): CardIndexData {
	const index = testCardIndex();
	return { ...index, values: [...index.values, ...values] };
}

function listed(): string[] {
	return page
		.getByRole('tabpanel')
		.getByRole('link')
		.elements()
		.map((link) => link.querySelector('.name')?.textContent ?? '');
}

describe('CardIndexTabs', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('sorts authors by the year of birth, with the unknown ones last', async () => {
		renderTabs(
			'author',
			withValues(
				{ id: 'a-giotto', category: 'author', name: 'Giotto', count: 1, birthYear: 1267 },
				{ id: 'a-anon', category: 'author', name: 'Anonim', count: 1 },
				{ id: 'a-rembrandt', category: 'author', name: 'Rembrandt', count: 1, birthYear: 1606 }
			)
		);

		await page
			.getByRole('combobox', { name: m.cardIndex.sortLabel })
			.selectOptions(m.cardIndex.sorts.life);

		const names = listed();
		expect(names.indexOf('Giotto')).toBeLessThan(names.indexOf('Rembrandt'));
		expect(names.indexOf('Anonim')).toBeGreaterThan(names.indexOf('Rembrandt'));
	});

	it('sorts places by country and shows the country, and remembers the choice', async () => {
		const index = withValues(
			{ id: 'l-uffizi', category: 'location', name: 'Uffizi', count: 1, countryCode: 'IT' },
			{ id: 'l-orsay', category: 'location', name: 'Orsay', count: 1, countryCode: 'FR' }
		);
		renderTabs('location', index);

		await page
			.getByRole('combobox', { name: m.cardIndex.sortLabel })
			.selectOptions(m.cardIndex.sorts.country);

		const names = listed();
		expect(names.indexOf('Orsay')).toBeLessThan(names.indexOf('Uffizi'));
		await expect.element(page.getByText('Francja')).toBeVisible();

		document.body.innerHTML = '';
		renderTabs('location', index);
		await expect
			.element(page.getByRole('combobox', { name: m.cardIndex.sortLabel }))
			.toHaveValue('country');
	});

	it('finds a style in the timeline under its era and period', async () => {
		renderTabs('timeline');

		await page.getByRole('searchbox', { name: m.cardIndex.search.timeline }).fill('dor');

		await expect.element(page.getByRole('link', { name: /^Doric/ }).first()).toBeVisible();
		await expect.element(page.getByRole('link', { name: /^Classical/ }).first()).toBeVisible();
		await expect.element(page.getByRole('link', { name: /^Ionic/ })).not.toBeInTheDocument();
	});
});
