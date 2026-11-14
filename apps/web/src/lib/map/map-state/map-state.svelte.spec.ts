import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { testGeography, testPlace } from '#lib/testing/map/map.ts';
import { MapState } from './map-state.svelte.ts';

vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));

const paris = testPlace('Paryż', {
	placeType: 'city',
	countryCode: 'FR',
	point: { latitude: 48.857, longitude: 2.35 }
});
const places = [
	paris,
	testPlace('Louvre', { cityId: paris.id }),
	testPlace('Rzym', { placeType: 'city' }),
	testPlace('Belvedere')
];
const artworks = [
	testArtwork(1, 'Mona Lisa', { location: 'Louvre', seen: true }),
	testArtwork(2, 'Pieta', { location: 'Rzym' }),
	testArtwork(3, 'The Kiss', { location: 'Belvedere' })
];

describe('MapState', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
	});

	it('draws the cities that reach the map and fits them', async () => {
		const state = new MapState(places, () => artworks);
		await state.load();

		expect(state.placed).toBe(true);
		expect(state.cities.map((city) => city.name)).toEqual(['Paryż']);
		expect(state.fit).toEqual([paris.point]);
	});

	it('says nothing is on the map when no place has a city or a point', () => {
		const state = new MapState([testPlace('Belvedere')], () => artworks);

		expect(state.placed).toBe(false);
	});

	it('drops the selected city when the filter hides it', async () => {
		const state = new MapState(places, () => artworks);
		await state.load();
		state.select(state.cities[0]);
		expect(state.selected?.name).toBe('Paryż');

		state.setFilter('wantToSee');

		expect(state.selected).toBeUndefined();
	});

	it('remembers that the geography failed', async () => {
		vi.mocked(loadGeography).mockRejectedValue(new Error('offline'));
		const state = new MapState(places, () => artworks);

		await state.load();

		expect(state.geographyFailed).toBe(true);
		expect(state.cities).toEqual([]);
	});
});
