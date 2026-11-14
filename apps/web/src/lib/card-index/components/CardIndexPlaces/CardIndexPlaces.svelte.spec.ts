import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import CardIndexPlaces from './CardIndexPlaces.svelte';

const places = {
	countries: [
		{
			code: 'FR',
			name: 'Francja',
			count: 3,
			groups: [
				{
					id: 'paris',
					name: 'Paryż',
					count: 3,
					city: true,
					places: [{ id: 'louvre', name: 'Luwr', count: 2 }]
				}
			]
		}
	],
	withoutCountry: [{ id: 'hall', name: 'Hall VIII', count: 1, city: false, places: [] }]
};

describe('CardIndexPlaces', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('shows the countries and the places without a country', async () => {
		render(CardIndexPlaces, { props: { places } });

		await expect.element(page.getByRole('heading', { name: 'Francja' })).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.placesWithoutCountry }))
			.toBeVisible();
		await expect.element(page.getByText('Hall VIII')).toBeVisible();
	});

	it('unfolds the city of a place found by the search', async () => {
		render(CardIndexPlaces, { props: { places, query: 'luwr' } });

		await expect.element(page.getByText('Luwr')).toBeVisible();
		await expect.element(page.getByText('Hall VIII')).not.toBeInTheDocument();
	});

	it('says when the atelier has no places yet', async () => {
		render(CardIndexPlaces, { props: { places: { countries: [], withoutCountry: [] } } });

		await expect.element(page.getByText(m.cardIndex.emptyList.location)).toBeVisible();
	});
});
