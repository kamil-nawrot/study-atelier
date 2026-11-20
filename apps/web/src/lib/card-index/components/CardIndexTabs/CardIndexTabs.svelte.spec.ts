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

describe('CardIndexTabs', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('groups authors under the eras of their artworks, oldest artwork first', async () => {
		const index = withValues(
			{ id: 'a-giotto', category: 'author', name: 'Giotto', count: 2, birthYear: 1600 },
			{ id: 'a-anon', category: 'author', name: 'Anonim', count: 1 },
			{ id: 'a-duccio', category: 'author', name: 'Duccio', count: 1, birthYear: 1255 }
		);
		renderTabs('author', {
			...index,
			authorEras: [
				...index.authorEras,
				{ authorId: 'a-giotto', eraCode: 'middle_ages', count: 1, oldestYear: 1305 },
				{ authorId: 'a-giotto', eraCode: 'early_modern', count: 1, oldestYear: 1500 },
				{ authorId: 'a-anon', eraCode: 'middle_ages', count: 1 },
				{ authorId: 'a-duccio', eraCode: 'middle_ages', count: 1, oldestYear: 1308 }
			]
		});

		await page
			.getByRole('combobox', { name: m.cardIndex.sortLabel })
			.selectOptions(m.cardIndex.sorts.oldest);

		const middleAges = page
			.getByRole('listitem')
			.filter({ has: page.getByRole('heading', { name: m.eras.middle_ages.name }) });
		const names = middleAges
			.getByRole('link')
			.elements()
			.map((link) => link.querySelector('.name')?.textContent ?? '')
			.filter(Boolean);
		expect(names).toEqual(['Giotto', 'Duccio', 'Anonim']);
		await expect
			.element(
				page.getByRole('link', { name: m.cardIndex.openValue('Giotto', m.atelier.count(1)) }).nth(1)
			)
			.toBeInTheDocument();
		await expect.element(page.getByText(m.cardIndex.authorsWithoutEra)).toBeVisible();
	});

	it('groups places under their country and city, with the rest under "Miejsca bez kraju"', async () => {
		renderTabs(
			'location',
			withValues(
				{
					id: 'l-florence',
					category: 'location',
					name: 'Florencja',
					count: 1,
					countryCode: 'IT',
					placeType: 'city'
				},
				{
					id: 'l-uffizi',
					category: 'location',
					name: 'Uffizi',
					count: 3,
					countryCode: 'IT',
					placeType: 'museum',
					cityId: 'l-florence'
				},
				{ id: 'l-home', category: 'location', name: 'Home', count: 1 }
			)
		);

		await expect.element(page.getByRole('heading', { name: 'Włochy' })).toBeVisible();
		await expect
			.element(
				page.getByRole('link', { name: m.cardIndex.openValue('Florencja', m.atelier.count(4)) })
			)
			.toBeVisible();
		await expect.element(page.getByText('Uffizi')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.placesWithoutCountry }))
			.toBeVisible();

		await page.getByRole('button', { name: 'Florencja' }).click();
		await expect.element(page.getByText('Uffizi')).toBeVisible();
	});

	it('finds a place under its country and city', async () => {
		renderTabs(
			'location',
			withValues(
				{
					id: 'l-florence',
					category: 'location',
					name: 'Florencja',
					count: 0,
					countryCode: 'IT',
					placeType: 'city'
				},
				{
					id: 'l-uffizi',
					category: 'location',
					name: 'Uffizi',
					count: 3,
					countryCode: 'IT',
					placeType: 'museum',
					cityId: 'l-florence'
				}
			)
		);

		await page.getByRole('searchbox', { name: m.cardIndex.search.location }).fill('uff');

		await expect.element(page.getByRole('heading', { name: 'Włochy' })).toBeVisible();
		await expect.element(page.getByText('Uffizi')).toBeVisible();
		await expect.element(page.getByText('Athens')).not.toBeInTheDocument();
	});

	it('offers to add a value on every tab of values', async () => {
		await page.viewport(1280, 800);
		renderTabs('timeline');

		await expect
			.element(page.getByRole('link', { name: m.cardIndex.add.period }))
			.toHaveAttribute('href', '/atelier/values/period/new');
		await expect
			.element(page.getByRole('link', { name: m.cardIndex.add.style }))
			.toHaveAttribute('href', '/atelier/values/style/new');
	});

	it('offers a period or a style from one add button on a phone', async () => {
		await page.viewport(390, 844);
		renderTabs('timeline');

		await page.getByRole('button', { name: m.common.add, exact: true }).click();

		await expect
			.element(page.getByRole('link', { name: m.cardIndex.add.period }))
			.toHaveAttribute('href', '/atelier/values/period/new');
		await expect
			.element(page.getByRole('link', { name: m.cardIndex.add.style }))
			.toHaveAttribute('href', '/atelier/values/style/new');
	});

	it('offers to add an author on the authors tab', async () => {
		renderTabs('author');

		await expect
			.element(page.getByRole('link', { name: m.cardIndex.add.author }))
			.toHaveAttribute('href', '/atelier/values/author/new');
	});

	it('finds a style in the timeline under its era and period', async () => {
		renderTabs('timeline');

		await page.getByRole('searchbox', { name: m.cardIndex.search.timeline }).fill('dor');

		await expect.element(page.getByRole('link', { name: /^Doric/ }).first()).toBeVisible();
		await expect.element(page.getByRole('link', { name: /^Classical/ }).first()).toBeVisible();
		await expect.element(page.getByRole('link', { name: /^Ionic/ })).not.toBeInTheDocument();
	});

	it('shows the type of a place after its name and the number of artworks in words', async () => {
		renderTabs(
			'location',
			withValues({
				id: 'l-louvre',
				category: 'location',
				name: 'Louvre',
				count: 2,
				placeType: 'museum'
			})
		);

		const louvre = page.getByRole('listitem').filter({ hasText: 'Louvre' });
		await expect.element(louvre.getByTitle(m.valueForm.placeTypes.museum)).toBeInTheDocument();
		await expect.element(louvre).toHaveTextContent(m.atelier.count(2));
	});
});
