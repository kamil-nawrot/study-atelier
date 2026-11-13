import { afterEach, describe, expect, it, vi } from 'vitest';
import { placeSearchQuery, pointOf, searchWikidataPlaces } from './wikidata-places.ts';

function answer(bindings: Record<string, string>[]): Response {
	return new Response(
		JSON.stringify({
			results: {
				bindings: bindings.map((row) =>
					Object.fromEntries(Object.entries(row).map(([key, value]) => [key, { value }]))
				)
			}
		}),
		{ status: 200 }
	);
}

const louvre = {
	item: 'http://www.wikidata.org/entity/Q19675',
	label: 'Luwr',
	description: 'muzeum sztuki w Paryżu',
	coord: 'Point(2.33583 48.86111)'
};

describe('placeSearchQuery', () => {
	it('searches the entities by name and keeps those with a point', () => {
		const query = placeSearchQuery('  Luwr \n');

		expect(query).toContain('mwapi:search "Luwr"');
		expect(query).toContain('wdt:P625');
	});
});

describe('pointOf', () => {
	it('reads a point written as longitude and latitude', () => {
		expect(pointOf('Point(-73.97778 40.76139)')).toEqual({
			latitude: 40.76139,
			longitude: -73.97778
		});
	});

	it('refuses a point outside the globe or written otherwise', () => {
		expect(pointOf('Point(200 10)')).toBeNull();
		expect(pointOf('somewhere')).toBeNull();
		expect(pointOf(undefined)).toBeNull();
	});
});

describe('searchWikidataPlaces', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('searches the part before a comma and returns at most three places', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValue(
				answer([
					louvre,
					{ ...louvre, item: 'x/Q1' },
					{ ...louvre, item: 'x/Q2' },
					{ ...louvre, item: 'x/Q3' }
				])
			);
		vi.stubGlobal('fetch', fetch);

		const places = await searchWikidataPlaces('Luwr, Paryż');

		expect(places).toHaveLength(3);
		expect(places[0]).toEqual({
			wikidataId: 'Q19675',
			label: 'Luwr',
			description: 'muzeum sztuki w Paryżu',
			latitude: 48.86111,
			longitude: 2.33583
		});
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(new URL(fetch.mock.calls[0][0]).searchParams.get('query')).toContain('"Luwr"');
	});

	it('searches the whole name when the part before a comma finds nothing', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(answer([]))
			.mockResolvedValueOnce(answer([{ ...louvre, coord: 'nowhere' }, louvre]));
		vi.stubGlobal('fetch', fetch);

		const places = await searchWikidataPlaces('Luwr, Paryż');

		expect(places.map((place) => place.wikidataId)).toEqual(['Q19675']);
		expect(new URL(fetch.mock.calls[1][0]).searchParams.get('query')).toContain('"Luwr, Paryż"');
	});

	it('searches nothing for an empty name', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);

		await expect(searchWikidataPlaces('  ')).resolves.toEqual([]);
		expect(fetch).not.toHaveBeenCalled();
	});
});
