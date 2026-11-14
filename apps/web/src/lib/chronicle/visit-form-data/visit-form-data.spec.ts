import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadVisitPlaces } from '#lib/card-index/category-values-data/category-values-data.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadTrips, loadVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadTowns } from '#lib/map/geography/geography.ts';
import { loadMapPlaces } from '#lib/map/places-data/places-data.ts';
import { loadEditorNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { testTrip, testVisit } from '#lib/testing/chronicle/chronicle.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadVisitForm } from './visit-form-data.ts';

vi.mock('#lib/card-index/category-values-data/category-values-data.ts', () => ({
	loadVisitPlaces: vi.fn()
}));
vi.mock('#lib/card-index/place-starter-data/place-starter-data.ts', () => ({
	loadPlaceStarter: vi.fn()
}));
vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({
	loadVisit: vi.fn(),
	loadTrips: vi.fn()
}));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/notes/note-link-data/note-link-data.ts')>()),
	loadEditorNoteLinks: vi.fn()
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadAtelier: vi.fn() }));
vi.mock('#lib/map/geography/geography.ts', () => ({ loadTowns: vi.fn() }));
vi.mock('#lib/map/places-data/places-data.ts', () => ({ loadMapPlaces: vi.fn() }));

const paris = { name: 'Paryż', countryCode: 'FR', latitude: 48.857, longitude: 2.352 };

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(loadAtelier).mockResolvedValue({ artworks: [] });
	vi.mocked(loadVisitPlaces).mockResolvedValue({ places: ['Orsay'] });
	vi.mocked(loadPlaceStarter).mockResolvedValue(emptyPlaceStarter());
	vi.mocked(loadEditorNoteLinks).mockResolvedValue({ suggest: vi.fn(), resolve: vi.fn() });
	vi.mocked(loadMapPlaces).mockResolvedValue({
		places: [
			{
				id: 'paris',
				name: 'Paryż',
				placeType: 'city',
				countryCode: 'FR',
				point: { latitude: 48.857, longitude: 2.352 },
				cityId: null
			}
		]
	});
	vi.mocked(loadTowns).mockResolvedValue([paris]);
	vi.mocked(loadTrips).mockResolvedValue({ visits: [testTrip()] });
});

describe('loadVisitForm', () => {
	it('gives a trip the places with their points and the towns', async () => {
		const data = await loadVisitForm();

		expect(data.tripPlaces).toEqual([
			{
				id: 'paris',
				name: 'Paryż',
				placeType: 'city',
				countryCode: 'FR',
				point: { latitude: 48.857, longitude: 2.352 },
				cityId: null
			}
		]);
		expect(data.towns).toEqual([paris]);
	});

	it('gives the trips a visit can be part of, but not the trip being edited', async () => {
		expect((await loadVisitForm()).trips).toEqual([testTrip()]);

		vi.mocked(loadVisit).mockResolvedValue({ visit: testTrip() });
		expect((await loadVisitForm(testTrip().id)).trips).toEqual([]);
	});

	it('reports places that do not load instead of opening a trip without its cities', async () => {
		vi.mocked(loadMapPlaces).mockResolvedValue({ places: [], error: 'offline' });

		expect((await loadVisitForm()).error).toBe('offline');
	});

	it('opens the form without towns when they do not load', async () => {
		vi.mocked(loadTowns).mockRejectedValue(new Error('offline'));

		const data = await loadVisitForm();

		expect(data.towns).toEqual([]);
	});

	it('gives an empty form the places, the artworks and no visit', async () => {
		const data = await loadVisitForm();

		expect(loadVisit).not.toHaveBeenCalled();
		expect(data.places).toEqual(['Orsay']);
		expect(data.visit).toBeUndefined();
	});

	it('suggests the places of artworks and of visits once each, in order', async () => {
		vi.mocked(loadVisitPlaces).mockResolvedValue({ places: ['Orsay', 'Kościół Mariacki'] });
		vi.mocked(loadAtelier).mockResolvedValue({
			artworks: [
				testArtwork(1, 'Lilie', { location: 'Orsay' }),
				testArtwork(2, 'Mona Lisa', { location: 'Luwr' }),
				testArtwork(3, 'Szkic', { location: null })
			]
		});

		const data = await loadVisitForm();

		expect(data.places).toEqual(['Kościół Mariacki', 'Luwr', 'Orsay']);
	});

	it('loads the visit to edit and passes on an error of the collection', async () => {
		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit() });
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [], error: 'offline' });

		const data = await loadVisitForm('id');

		expect(data.visit).toEqual(testVisit());
		expect(data.error).toBe('offline');
	});

	it('loads the labels of the note links only for a visit whose notes link', async () => {
		await loadVisitForm();
		expect(loadEditorNoteLinks).toHaveBeenLastCalledWith(undefined);

		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit({ notes: 'See [x](/atelier/1).' }) });
		await loadVisitForm('id');
		expect(loadEditorNoteLinks).toHaveBeenLastCalledWith({ visitId: 'id' });
	});
});
