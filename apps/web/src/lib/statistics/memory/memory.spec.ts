import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import { mostForgotten, mostReviewed, mostStable } from './memory.ts';

const now = new Date('2026-11-03T12:00:00Z');
const artworks = [testArtwork(1, 'Ofelia'), testArtwork(2, 'Madonna'), testArtwork(3, 'Sztandar')];
const cards = new Map([
	[
		'artwork-1',
		testReviewCard('artwork-1', new Date('2026-11-05T12:00:00Z'), { lapses: 2, stability: 2 })
	],
	[
		'artwork-2',
		testReviewCard('artwork-2', new Date('2026-11-04T12:00:00Z'), { lapses: 2, stability: 1 })
	],
	[
		'artwork-3',
		testReviewCard('artwork-3', new Date('2026-11-26T12:00:00Z'), { lapses: 0, stability: 6.6 })
	]
]);

describe('memory', () => {
	it('lists the forgotten artworks by lapses and then by record number', () => {
		expect(mostForgotten(artworks, cards).map((row) => [row.artwork.title, row.count])).toEqual([
			['Ofelia', 2],
			['Madonna', 2]
		]);
	});

	it('maps the most reviewed artworks from the database to the collection', () => {
		expect(
			mostReviewed(artworks, [
				{ artworkId: 'artwork-2', times: 12 },
				{ artworkId: 'gone', times: 9 }
			]).map((row) => [row.artwork.title, row.count])
		).toEqual([['Madonna', 12]]);
	});

	it('finds the most stable artwork and the days to its next review', () => {
		expect(mostStable(artworks, cards, now)).toEqual({ artwork: artworks[2], days: 23 });
		expect(mostStable(artworks, new Map(), now)).toBeUndefined();
	});
});
