import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readAlbumSource } from './album-format.ts';

const SAMPLE = 'static/albums/sample-album/album.json';

type Json = Record<string, unknown> & { artworks: Record<string, unknown>[] };

function sample(): Json {
	return JSON.parse(readFileSync(SAMPLE, 'utf8')) as Json;
}

function errorsOf(json: unknown): string[] {
	return readAlbumSource(json, 'sample-album').errors ?? [];
}

describe('readAlbumSource', () => {
	it('reads the sample album with its entries, values and image paths', () => {
		const read = readAlbumSource(sample(), 'sample-album');

		if (read.errors) throw new Error(read.errors.join('\n'));
		const [spiral, square] = read.source.artworks;
		expect(spiral).toEqual({
			id: 'spiral-study',
			revision: 1,
			wikidataId: null,
			typeCode: 'painting',
			eraCode: 'contemporary',
			yearFrom: 2024,
			yearTo: 2025,
			yearApproximate: true,
			valueIds: ['sample-painter', 'sample-style', 'sample-oil', 'sample-gallery'],
			termIds: ['sample-spiral'],
			eventIds: ['sample-show'],
			images: [
				{
					path: 'sample-album/images/spiral-study.webp',
					width: 600,
					height: 800,
					licence: 'CC0',
					licenceUrl: null,
					attribution: 'Sample image'
				}
			]
		});
		expect(square.revision).toBe(2);
		expect(read.source.values.find((value) => value.category === 'location')).toMatchObject({
			countryCode: 'PL',
			placeType: 'gallery'
		});
	});

	it('refuses another format, an unknown era and an album without artworks', () => {
		expect(errorsOf({ format: 2, era: 'future', artworks: [] })).toEqual([
			'album.format: is not 1',
			'album.era: is not one of prehistory, antiquity, middle_ages, early_modern, modern, contemporary',
			'artworks: is empty'
		]);
	});

	it('refuses an entry id that is not a slug, a repeated id and an unknown reference', () => {
		const json = sample();
		json.artworks[1].id = 'Blue Square';
		json.artworks[2].id = 'spiral-study';
		json.artworks[2].values = ['sample-nobody'];

		expect(errorsOf(json)).toEqual([
			'artworks[1].id: does not match /^[a-z0-9]+(-[a-z0-9]+)*$/',
			'artworks: repeats the id "spiral-study"',
			'artworks.spiral-study.values: names an unknown value "sample-nobody"'
		]);
	});

	it('refuses an image outside the images folder, without a licence or too many images', () => {
		const json = sample();
		const image = { file: 'images/a.webp', width: 1, height: 1, licence: 'CC0' };
		json.artworks[0].images = [{ file: '../a.webp', width: 1, height: 1 }];
		json.artworks[1].images = Array.from({ length: 6 }, () => image);

		expect(errorsOf(json)).toEqual([
			'artworks[0].images[0]: has no "licence"',
			'artworks[0].images[0].file: does not match /^images\\/[a-z0-9]+(-[a-z0-9]+)*\\.(webp|jpg|png)$/',
			'artworks[0].images[0].licence: is not a text',
			'artworks[0].images: is empty',
			'artworks[1].images: has more than 5 items'
		]);
	});

	it('refuses details that do not belong to the category or kind of an entry', () => {
		const json = sample();
		json.values = [
			{ id: 'v', revision: 1, category: 'style', birthYear: 1500, placeType: 'museum' }
		];
		json.terms = [{ id: 't', revision: 1, kind: 'term', category: 'ruler', deathYear: 1500 }];
		json.events = [{ id: 'e', revision: 1, yearFrom: 1500, yearTo: 1500 }];
		json.artworks = [{ ...json.artworks[1], values: ['v'] }];

		expect(errorsOf(json)).toEqual([
			'values[0]: has "birthYear" but is no author',
			'values[0]: has "placeType" but is no location',
			'terms[0]: has "deathYear" but is no figure',
			'terms[0].category: is not one of architecture, painting, sculpture, technique, iconography, general',
			'events[0]: does not end after it starts'
		]);
	});

	it('refuses an artwork with two locations or one value twice', () => {
		const json = sample();
		(json.values as Record<string, unknown>[]).push({
			id: 'second-gallery',
			revision: 1,
			category: 'location'
		});
		json.artworks[2].values = ['sample-gallery', 'second-gallery', 'second-gallery'];

		expect(errorsOf(json)).toEqual([
			'artworks.red-circle.values: names more than one location',
			'artworks.red-circle.values: names a value twice'
		]);
	});
});
