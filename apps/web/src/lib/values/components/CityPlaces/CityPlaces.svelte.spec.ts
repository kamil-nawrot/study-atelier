import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import CityPlaces from './CityPlaces.svelte';

describe('CityPlaces', () => {
	it('lists the places of a city under its heading', async () => {
		render(CityPlaces, {
			props: { places: [{ id: 'orsay', name: "Musée d'Orsay", count: 13, placeType: 'museum' }] }
		});

		await expect
			.element(page.getByRole('heading', { name: m.valuePage.city.places }))
			.toBeVisible();
		await expect.element(page.getByText("Musée d'Orsay")).toBeVisible();
	});
});
