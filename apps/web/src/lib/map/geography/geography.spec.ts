import { afterEach, describe, expect, it, vi } from 'vitest';
import { geographyOf, townsOf } from './geography.ts';

describe('townsOf', () => {
	it('reads the rows of the bundled towns', () => {
		expect(townsOf([[2.35, 48.857, 'Paryż', 'FR']])).toEqual([
			{ name: 'Paryż', countryCode: 'FR', longitude: 2.35, latitude: 48.857 }
		]);
	});

	it('reads the Wikidata id, the region and the other names of a town', () => {
		expect(
			townsOf([
				[11.573, 48.132, 'Monachium', 'DE', 'Q1726', 'Bayern', 'Munich'],
				[8.675, 50.1, 'Frankfurt', 'DE', 'Q1794', 'Hessen'],
				[-0.119, 51.502, 'Londyn', 'GB', '', 'Westminster', '', 'London']
			])
		).toEqual([
			{
				name: 'Monachium',
				countryCode: 'DE',
				longitude: 11.573,
				latitude: 48.132,
				wikidataId: 'Q1726',
				region: 'Bayern',
				otherNames: ['Munich']
			},
			{
				name: 'Frankfurt',
				countryCode: 'DE',
				longitude: 8.675,
				latitude: 50.1,
				wikidataId: 'Q1794',
				region: 'Hessen'
			},
			{
				name: 'Londyn',
				countryCode: 'GB',
				longitude: -0.119,
				latitude: 51.502,
				region: 'Westminster',
				otherNames: ['London']
			}
		]);
	});
});

describe('geographyOf', () => {
	it('turns the topology into land and the borders between countries', () => {
		const world = {
			type: 'Topology',
			arcs: [
				[
					[0, 0],
					[0, 10]
				],
				[
					[0, 10],
					[10, 10],
					[10, 0],
					[0, 0]
				],
				[
					[0, 0],
					[-10, 0],
					[-10, 10],
					[0, 10]
				]
			],
			objects: {
				countries: {
					type: 'GeometryCollection',
					geometries: [
						{ type: 'Polygon', arcs: [[0, 1]] },
						{ type: 'Polygon', arcs: [[2, ~0]] }
					]
				},
				land: { type: 'GeometryCollection', geometries: [{ type: 'Polygon', arcs: [[1, 2]] }] }
			}
		};

		const geography = geographyOf(world as never);

		expect(geography.land.features).toHaveLength(1);
		expect(geography.borders.coordinates).toEqual([
			[
				[0, 0],
				[0, 10]
			]
		]);
	});
});

describe('loadGeography', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it('loads only the world once and tries again after a failure', async () => {
		const fetch = vi.fn().mockResolvedValue(new Response('', { status: 500 }));
		vi.stubGlobal('fetch', fetch);
		const { loadGeography } = await import('./geography.ts');

		await expect(loadGeography()).rejects.toThrow();
		fetch.mockImplementation(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						type: 'Topology',
						arcs: [],
						objects: {
							countries: { type: 'GeometryCollection', geometries: [] },
							land: { type: 'GeometryCollection', geometries: [] }
						}
					})
				)
			)
		);

		await loadGeography();
		await loadGeography();

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch.mock.calls.every(([url]) => String(url).endsWith('world.json'))).toBe(true);
	});
});

describe('loadTowns', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it('loads only the towns once and tries again after a failure', async () => {
		const fetch = vi.fn().mockResolvedValue(new Response('', { status: 500 }));
		vi.stubGlobal('fetch', fetch);
		const { loadTowns } = await import('./geography.ts');

		await expect(loadTowns()).rejects.toThrow();
		fetch.mockResolvedValue(new Response(JSON.stringify([[2.35, 48.857, 'Paryż', 'FR']])));

		const towns = await loadTowns();
		await loadTowns();

		expect(towns).toEqual([
			{ name: 'Paryż', countryCode: 'FR', longitude: 2.35, latitude: 48.857 }
		]);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch.mock.calls.every(([url]) => String(url).endsWith('towns.json'))).toBe(true);
	});
});
