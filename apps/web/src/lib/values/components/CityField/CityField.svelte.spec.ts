import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { loadTowns } from '#lib/map/geography/geography.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import CityField from './CityField.svelte';

vi.mock('#lib/map/geography/geography.ts', () => ({ loadTowns: vi.fn() }));

const paris: CardIndexRecord = {
	id: 'paris',
	category: 'location',
	name: 'Paryż',
	count: 2,
	placeType: 'city',
	countryCode: 'FR'
};

describe('CityField', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadTowns).mockResolvedValue([
			{ name: 'Toledo', countryCode: 'ES', latitude: 39.86, longitude: -4.03, wikidataId: 'Q5836' }
		]);
	});

	it('suggests the learner’s cities and the catalogue towns and gives the chosen town', async () => {
		const onchange = vi.fn();
		render(CityField, { cities: [paris], city: null, onchange });

		await expect.element(page.getByText(m.valueForm.cityHint)).toBeVisible();
		await userEvent.type(page.getByRole('combobox', { name: m.valueForm.city }), 'tol');
		await page.getByRole('option', { name: /Toledo/ }).click();

		expect(onchange).toHaveBeenCalledWith({
			name: 'Toledo',
			countryCode: 'ES',
			point: { latitude: 39.86, longitude: -4.03 },
			wikidataId: 'Q5836'
		});
	});

	it('gives a city of the atelier with its id and a new name without one', async () => {
		const onchange = vi.fn();
		render(CityField, { cities: [paris], city: null, onchange });

		const field = page.getByRole('combobox', { name: m.valueForm.city });
		await userEvent.type(field, 'par');
		await page.getByRole('option', { name: /Paryż/ }).click();
		expect(onchange).toHaveBeenLastCalledWith({ id: 'paris', name: 'Paryż', countryCode: 'FR' });
	});

	it('adds a town missing from the catalogue', async () => {
		const onchange = vi.fn();
		render(CityField, { cities: [], city: null, onchange });

		await userEvent.type(page.getByRole('combobox', { name: m.valueForm.city }), 'Tum');
		await page.getByRole('option', { name: /Tum/ }).click();
		expect(onchange).toHaveBeenLastCalledWith({ name: 'Tum' });
	});

	it('shows the chosen city with the line about the map and clears it', async () => {
		const onchange = vi.fn();
		render(CityField, { cities: [paris], city: { id: 'paris', name: 'Paryż' }, onchange });

		await expect.element(page.getByText(m.valueForm.cityOnMap('Paryż'))).toBeVisible();
		await page.getByRole('button', { name: /Paryż/ }).click();
		expect(onchange).toHaveBeenLastCalledWith(null);
	});
});
