import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { holdingsOf } from './holdings.ts';

describe('holdingsOf', () => {
	it('counts the artworks, distinct authors and places, and the artworks seen in person', () => {
		expect(
			holdingsOf([
				testArtwork(1, 'Mona Lisa', { authors: ['Leonardo'], location: 'Louvre', seen: true }),
				testArtwork(2, 'Annunciation', { authors: ['Leonardo'], location: 'Uffizi' }),
				testArtwork(3, 'Duo', {
					authors: ['Leonardo', 'Verrocchio'],
					location: 'Uffizi',
					seen: true
				}),
				testArtwork(4, 'Anonymous', { authors: [], location: null })
			])
		).toEqual({ artworks: 4, authors: 2, places: 2, seen: 2 });
	});

	it('counts nothing in an empty atelier', () => {
		expect(holdingsOf([])).toEqual({ artworks: 0, authors: 0, places: 0, seen: 0 });
	});
});
