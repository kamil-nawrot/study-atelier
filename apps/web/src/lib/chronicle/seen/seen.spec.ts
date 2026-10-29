import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { seenArtworks, seenCount } from './seen.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';

const lilies = testArtwork(1, 'Water Lilies');
const kiss = testArtwork(2, 'The Kiss');
const artworks = new Map([lilies, kiss].map((artwork) => [artwork.id, artwork]));

function visit(artworkIds: string[]): Visit {
	return {
		id: artworkIds.join(),
		place: 'Orsay',
		placeType: null,
		countryCode: null,
		date: { on: '2026-01-01', precision: 'year' },
		notes: '',
		artworkIds
	};
}

describe('seenArtworks', () => {
	it('gives the artworks of a visit in its order and skips those not in the collection', () => {
		expect(seenArtworks(visit(['artwork-2', 'trashed', 'artwork-1']), artworks)).toEqual([
			kiss,
			lilies
		]);
	});
});

describe('seenCount', () => {
	it('counts every artwork seen once, however many visits hold it', () => {
		expect(
			seenCount([visit(['artwork-1', 'artwork-2']), visit(['artwork-1', 'gone'])], artworks)
		).toBe(2);
	});
});
