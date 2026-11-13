import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import { PlaceSearch } from './place-search.svelte.ts';

vi.mock('#lib/images/wikidata-places/wikidata-places.ts', () => ({
	searchWikidataPlaces: vi.fn()
}));

const rome = {
	wikidataId: 'Q220',
	label: 'Rzym',
	description: '',
	latitude: 41.9,
	longitude: 12.5
};

describe('PlaceSearch', () => {
	beforeEach(() => vi.clearAllMocks());

	it('keeps only the answer for the latest name', async () => {
		let answerFirst: (places: (typeof rome)[]) => void = () => {};
		vi.mocked(searchWikidataPlaces)
			.mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)))
			.mockResolvedValueOnce([]);
		const search = new PlaceSearch();

		const first = search.search('Rzym');
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
