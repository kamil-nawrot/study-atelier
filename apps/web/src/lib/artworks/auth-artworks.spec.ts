import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { authArtworks, pickArtwork } from './auth-artworks';

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
