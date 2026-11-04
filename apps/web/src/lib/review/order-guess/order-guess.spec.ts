import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import {
	chronological,
	dropIndex,
	moved,
	orderBounds,
	orderItems,
	orderPlaces,
	placedRight
} from './order-guess.ts';

const oldest = testArtwork(1, 'Oldest', { yearTo: 1420 });
const older = testArtwork(2, 'Older', { yearFrom: 1503, yearTo: 1519 });
const newer = testArtwork(3, 'Newer', { yearTo: 1642 });
const newest = testArtwork(4, 'Newest', { yearTo: 1889 });

describe('chronological', () => {
	it('orders the artworks by their first year', () => {
		expect(chronological([newest, older, oldest, newer])).toEqual([oldest, older, newer, newest]);
	});
});

describe('moved', () => {
	it('moves a value to another place and keeps the rest in order', () => {
		expect(moved(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
		expect(moved(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
		expect(moved(['a', 'b', 'c', 'd'], 1, 9)).toEqual(['a', 'c', 'd', 'b']);
	});
});

describe('orderPlaces', () => {
	it('marks each artwork right or wrong with its right place', () => {
		expect(orderPlaces([oldest, newer, older, newest])).toEqual([
			{ artwork: oldest, right: true, place: 0 },
			{ artwork: newer, right: false, place: 2 },
			{ artwork: older, right: false, place: 1 },
			{ artwork: newest, right: true, place: 3 }
		]);
		expect(placedRight([oldest, newer, older, newest])).toBe(2);
		expect(placedRight([oldest, older, newer, newest])).toBe(4);
		expect(placedRight([newest, newer, older, oldest])).toBe(0);
	});
});

describe('dropIndex', () => {
	it('counts the other images whose middle the pointer has passed', () => {
		const centres = [50, 150, 250, 350];
		expect(dropIndex(10, centres, 2)).toBe(0);
		expect(dropIndex(200, centres, 0)).toBe(1);
		expect(dropIndex(400, centres, 0)).toBe(3);
		expect(dropIndex(260, centres, 2)).toBe(2);
	});
});

describe('orderBounds', () => {
	it('spans the years of all four artworks', () => {
		expect(orderBounds([newer, oldest, newest, older])).toEqual([1420, 1889]);
	});
});

describe('orderItems', () => {
	it('turns a full order row into a question in the order shown and leaves out the rest', () => {
		const artworks = new Map(
			[oldest, older, newer, newest].map((artwork) => [artwork.id, artwork])
		);
		const undated = testArtwork(5, 'Undated', { yearFrom: null, yearTo: null });
		artworks.set(undated.id, undated);

		expect(
			orderItems(
				[
					{ mode: 'order', artwork_ids: [newest.id, oldest.id, newer.id, older.id] },
					{ mode: 'order', artwork_ids: [newest.id, oldest.id, newer.id, undated.id] },
					{ mode: 'order', artwork_ids: [newest.id, oldest.id, 'artwork-missing', older.id] },
					{ artwork_id: oldest.id, mode: 'year', card: null }
				],
				artworks
			)
		).toEqual([{ mode: 'order', artworks: [newest, oldest, newer, older] }]);
	});
});
