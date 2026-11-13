import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import { loadMuseumPlaces } from '#lib/map/museum-places-data/museum-places-data.ts';
import { PlaceSearch } from './place-search.svelte.ts';

vi.mock('#lib/images/wikidata-places/wikidata-places.ts', () => ({
	searchWikidataPlaces: vi.fn()
}));

vi.mock('#lib/map/museum-places-data/museum-places-data.ts', () => ({
	loadMuseumPlaces: vi.fn()
}));

const battles = {
	wikidataId: 'Q1817455',
	name: 'Galeria Bitew w Wersalu',
	alias: 'Gallery of Battles',
	countryCode: 'FR',
	point: { latitude: 48.8049, longitude: 2.1204 }
};

const rome = {
	wikidataId: 'Q220',
	label: 'Rzym',
	description: '',
	latitude: 41.9,
	longitude: 12.5
};

describe('PlaceSearch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadMuseumPlaces).mockResolvedValue([]);
	});

	it('offers a museum of the catalogue by its name or its alias before asking Wikidata', async () => {
		vi.mocked(loadMuseumPlaces).mockResolvedValue([battles]);
		vi.mocked(searchWikidataPlaces).mockResolvedValue([rome]);
		const search = new PlaceSearch();

		await search.search('Gallery of Battles');

		expect(search.status).toBe('ready');
		expect(search.places.map((place) => place.wikidataId)).toEqual(['Q1817455', 'Q220']);
		expect(search.places[0]).toMatchObject({ latitude: 48.8049, longitude: 2.1204 });
	});

	it('does not ask Wikidata when the catalogue already has enough matches', async () => {
		const museums = ['a', 'b', 'c'].map((id) => ({
			...battles,
			wikidataId: id,
			name: `Muzeum ${id}`
		}));
		vi.mocked(loadMuseumPlaces).mockResolvedValue(museums);
		const search = new PlaceSearch();

		await search.search('Muzeum');

		expect(searchWikidataPlaces).not.toHaveBeenCalled();
		expect(search.places).toHaveLength(3);
	});

	it('keeps the catalogue matches when Wikidata fails', async () => {
		vi.mocked(loadMuseumPlaces).mockResolvedValue([battles]);
		vi.mocked(searchWikidataPlaces).mockRejectedValue(new Error('offline'));
		const search = new PlaceSearch();

		await search.search('Galeria Bitew w Wersalu');

		expect(search.status).toBe('ready');
		expect(search.places).toHaveLength(1);
	});

	it('keeps only the answer for the latest name', async () => {
		let answerFirst: (places: (typeof rome)[]) => void = () => {};
		vi.mocked(searchWikidataPlaces)
			.mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)))
			.mockResolvedValueOnce([]);
		const search = new PlaceSearch();

		const first = search.search('Rzym');
		await vi.waitFor(() => expect(searchWikidataPlaces).toHaveBeenCalledTimes(1));
		await search.search('Nowhere');
		answerFirst([rome]);
		await first;

		expect(search.status).toBe('none');
		expect(search.places).toEqual([]);
	});

	it('is ready with the places found and failed when the search throws', async () => {
		const search = new PlaceSearch();
		vi.mocked(searchWikidataPlaces).mockResolvedValueOnce([rome]);
		await search.search('Rzym');
		expect(search.status).toBe('ready');

		vi.mocked(searchWikidataPlaces).mockRejectedValueOnce(new Error('offline'));
		await search.search('Rzym');
		expect(search.status).toBe('failed');
	});
});
