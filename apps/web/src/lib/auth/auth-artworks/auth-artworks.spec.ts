import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { authArtworks, pickArtwork } from './auth-artworks.ts';
import data from './auth-artworks.json';

describe('pickArtwork', () => {
	it('picks the first and last artwork at the ends of the range', () => {
		expect(pickArtwork(() => 0)).toBe(authArtworks[0]);
		expect(pickArtwork(() => 0.999)).toBe(authArtworks[authArtworks.length - 1]);
	});
});

describe('authArtworks', () => {
	it('maps every entry to a caption with a title, artist, date and credit', () => {
		for (const artwork of authArtworks) {
			expect(artwork.title.length).toBeGreaterThan(0);
			expect(artwork.artist.length).toBeGreaterThan(0);
			expect(artwork.date.length).toBeGreaterThan(0);
			expect(artwork.credit.length).toBeGreaterThan(0);
		}
	});

	it('credits the photographer where the photo is not public domain', () => {
		const credited = authArtworks.filter((artwork) => artwork.credit !== m.artwork.credit);
		expect(credited.length).toBeGreaterThan(0);
		for (const artwork of credited) {
			expect(artwork.credit).toContain('CC BY');
		}
	});

	it('writes years before the common era with the era suffix', () => {
		expect(
			authArtworks.some(
				(artwork) => artwork.date === m.artwork.yearBce(Number.parseInt(artwork.date))
			)
		).toBe(true);
	});

	it('uses the unknown-author label when the artist is not known', () => {
		expect(authArtworks.some((artwork) => artwork.artist === m.artwork.unknownArtist)).toBe(true);
	});
});

const publicDomain = ['Public domain', 'CC0'];

describe('auth-artworks.json', () => {
	it('lists around one hundred works', () => {
		expect(data.length).toBeGreaterThanOrEqual(100);
	});

	it('has unique Wikidata ids and Commons files', () => {
		expect(new Set(data.map((entry) => entry.id)).size).toBe(data.length);
		expect(new Set(data.map((entry) => entry.file)).size).toBe(data.length);
	});

	it('gives every entry a title, a year, a kind and a Commons image file', () => {
		for (const entry of data) {
			expect(entry.id).toMatch(/^Q\d+$/);
			expect(entry.title.length).toBeGreaterThan(0);
			expect(Number.isInteger(entry.year)).toBe(true);
			expect(['painting', 'sculpture', 'architecture', 'drawing']).toContain(entry.kind);
			expect(entry.file).toMatch(/\.(jpe?g|png|tiff?)$/i);
			expect(entry.file).not.toContain(' ');
		}
	});

	it('names the photographer wherever the image is not public domain', () => {
		for (const entry of data) {
			if (!publicDomain.includes(entry.license)) {
				expect(entry).toHaveProperty('photographer');
			}
		}
	});

	it('covers more than paintings', () => {
		const kinds = new Set(data.map((entry) => entry.kind));
		expect(kinds.has('sculpture')).toBe(true);
		expect(kinds.has('architecture')).toBe(true);
	});
});
