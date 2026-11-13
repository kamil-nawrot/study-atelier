import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { setPlacePoint } from '#lib/map/places-data/places-data.ts';
import { testGeography } from '#lib/testing/map/map.ts';
import PlacePosition from './PlacePosition.svelte';

vi.mock('#lib/images/wikidata-places/wikidata-places.ts', () => ({
	searchWikidataPlaces: vi.fn()
}));
vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));
vi.mock('#lib/map/places-data/places-data.ts', () => ({ setPlacePoint: vi.fn() }));

const rome = {
	wikidataId: 'Q220',
	label: 'Rzym',
	description: 'stolica Włoch',
	latitude: 41.89306,
	longitude: 12.48278
};

describe('PlacePosition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
		vi.mocked(searchWikidataPlaces).mockResolvedValue([rome]);
		vi.mocked(setPlacePoint).mockResolvedValue({});
	});

	it('says a place has no position and loads no map until it gets one', async () => {
		render(PlacePosition, { placeId: 'place-1', name: 'Rzym', point: null });

		await expect.element(page.getByText(m.map.position.empty)).toBeVisible();
		expect(loadGeography).not.toHaveBeenCalled();
	});

	it('sets the position from a suggestion', async () => {
		render(PlacePosition, { placeId: 'place-1', name: 'Rzym', point: null });

		await page.getByRole('button', { name: m.map.position.set }).click();
		await page.getByRole('button', { name: /stolica Włoch/ }).click();
		await page.getByRole('button', { name: m.common.save }).click();

		expect(setPlacePoint).toHaveBeenCalledWith(
			'place-1',
			{ latitude: 41.89306, longitude: 12.48278 },
			'Q220'
		);
		await expect.element(page.getByRole('button', { name: m.map.position.change })).toBeVisible();
	});

	it('shows the town of a point and removes the point', async () => {
		render(PlacePosition, {
			placeId: 'place-2',
			name: 'Luwr',
			point: { latitude: 48.86111, longitude: 2.33583 }
		});

		await expect.element(page.getByText('Paryż, Francja')).toBeVisible();
		await page.getByRole('button', { name: m.map.position.remove }).click();

		expect(setPlacePoint).toHaveBeenCalledWith('place-2', null, null);
		await expect.element(page.getByText(m.map.position.empty)).toBeVisible();
	});

	it('keeps editing and shows the error when saving fails', async () => {
		vi.mocked(setPlacePoint).mockResolvedValue({ error: m.map.saveFailed });
		render(PlacePosition, { placeId: 'place-1', name: 'Rzym', point: null });

		await page.getByRole('button', { name: m.map.position.set }).click();
		await page.getByRole('button', { name: /stolica Włoch/ }).click();
		await page.getByRole('button', { name: m.common.save }).click();

		await expect.element(page.getByText(m.map.saveFailed)).toBeVisible();
		await page.getByRole('button', { name: m.common.cancel }).click();
		await expect.element(page.getByText(m.map.position.empty)).toBeVisible();
	});

	it('says the map could not load', async () => {
		vi.mocked(loadGeography).mockRejectedValue(new Error('offline'));
		render(PlacePosition, {
			placeId: 'place-2',
			name: 'Luwr',
			point: { latitude: 48.86111, longitude: 2.33583 }
		});

		await expect.element(page.getByText(m.map.loadError)).toBeVisible();
	});
});
