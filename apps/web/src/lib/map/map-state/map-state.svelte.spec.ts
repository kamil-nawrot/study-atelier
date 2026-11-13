import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { setPlacePoint } from '#lib/map/places-data/places-data.ts';
import { testGeography, testPlace } from '#lib/testing/map/map.ts';
import { MapState } from './map-state.svelte.ts';

vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));
vi.mock('#lib/map/places-data/places-data.ts', () => ({ setPlacePoint: vi.fn() }));

const places = [
	testPlace('Louvre', { point: { latitude: 48.86111, longitude: 2.33583 } }),
	testPlace('Rzym'),
	testPlace('Belvedere')
];
const artworks = [
	testArtwork(1, 'Mona Lisa', { location: 'Louvre' }),
	testArtwork(2, 'Pieta', { location: 'Rzym' }),
	testArtwork(3, 'Moses', { location: 'Rzym' }),
	testArtwork(4, 'The Kiss', { location: 'Belvedere' })
];
const rome = { latitude: 41.89306, longitude: 12.48278 };

describe('MapState', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
		vi.mocked(setPlacePoint).mockResolvedValue({});
	});

	it('saves the chosen point of the current place and moves on', async () => {
		const state = new MapState(places, () => artworks);
		await state.load();
		state.startFilling();
		expect(state.current?.place.name).toBe('Rzym');

		state.choose({ point: rome, wikidataId: 'Q220' });
		expect(state.fit).toEqual([rome]);
		await state.save();

		expect(setPlacePoint).toHaveBeenCalledWith(places[1].id, rome, 'Q220');
		expect(state.current?.place.name).toBe('Belvedere');
		expect(state.choice).toBeNull();
		expect(state.missing).toHaveLength(1);
		expect(state.cities.map((city) => city.name)).toEqual(['Rzym', 'Paryż']);
	});

	it('keeps the place and shows the error when saving fails', async () => {
		vi.mocked(setPlacePoint).mockResolvedValue({ error: 'failed' });
		const state = new MapState(places, () => artworks);
		state.startFilling();
		state.pick(rome);
		await state.save();

		expect(state.saveError).toBe('failed');
		expect(state.current?.place.name).toBe('Rzym');
		expect(state.choice).toEqual({ point: rome, wikidataId: null });
	});

	it('takes a click on the map only while filling', () => {
		const state = new MapState(places, () => artworks);

		state.pick(rome);

		expect(state.choice).toBeNull();
	});

	it('drops the selected city when the filter hides it', async () => {
		const state = new MapState(places, () => artworks);
		await state.load();
		state.select(state.cities[0]);
		expect(state.selected?.name).toBe('Paryż');

		state.setFilter('seen');

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
