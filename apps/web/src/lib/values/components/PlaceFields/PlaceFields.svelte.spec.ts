import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { loadTowns } from '#lib/map/geography/geography.ts';
import type { LocationDetails } from '#lib/values/types/location-details.ts';
import PlaceFields from './PlaceFields.svelte';

vi.mock('#lib/map/geography/geography.ts', () => ({ loadTowns: vi.fn() }));

function location(extra: Partial<LocationDetails> = {}): LocationDetails {
	return { countryCode: null, placeType: 'museum', ...extra };
}

describe('PlaceFields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadTowns).mockResolvedValue([
			{ name: 'Paryż', countryCode: 'FR', latitude: 48.857, longitude: 2.35, wikidataId: 'Q90' }
		]);
	});

	it('shows the city and the country of a place without a city', async () => {
		render(PlaceFields, { location: location(), cities: [] });

		await expect.element(page.getByRole('combobox', { name: m.valueForm.city })).toBeVisible();
		await expect.element(page.getByRole('combobox', { name: m.valueForm.country })).toBeVisible();
	});

	it('takes the country of a chosen city and drops the own point', async () => {
		const place = location({ point: { latitude: 1, longitude: 1 } });
		render(PlaceFields, { location: place, cities: [] });

		await userEvent.type(page.getByRole('combobox', { name: m.valueForm.city }), 'pary');
		await page.getByRole('option', { name: /Paryż/ }).click();

		await vi.waitFor(() => expect(place.city?.name).toBe('Paryż'));
		expect(place.countryCode).toBe('FR');
		expect(place.point).toBeNull();
	});

	it('hides the country of a place with a city', async () => {
		render(PlaceFields, {
			location: location({ city: { id: 'paris', name: 'Paryż' } }),
			cities: []
		});

		await expect.element(page.getByText(m.valueForm.cityOnMap('Paryż'))).toBeVisible();
		expect(page.getByRole('combobox', { name: m.valueForm.country }).query()).toBeNull();
	});

	it('has no city field for a city and clears the city when the type becomes a city', async () => {
		const place = location({ city: { id: 'paris', name: 'Paryż' } });
		render(PlaceFields, { location: place, cities: [] });

		await page.getByRole('radio', { name: m.valueForm.placeTypes.city }).click();

		await vi.waitFor(() => expect(place.city).toBeNull());
		expect(place.placeType).toBe('city');
	});

	it('has no city field for a place of the type city', async () => {
		render(PlaceFields, { location: location({ placeType: 'city' }), cities: [] });

		await expect.element(page.getByRole('combobox', { name: m.valueForm.country })).toBeVisible();
		expect(page.getByRole('combobox', { name: m.valueForm.city }).query()).toBeNull();
	});

	it('shows the error of the type under the tiles', async () => {
		render(PlaceFields, {
			location: location({ placeType: 'museum' }),
			cities: [],
			typeError: m.cardIndex.errors.cityType
		});

		await expect.element(page.getByText(m.cardIndex.errors.cityType)).toBeVisible();
	});
});
