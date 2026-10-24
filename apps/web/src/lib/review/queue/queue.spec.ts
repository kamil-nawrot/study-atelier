import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import {
	MIN_ARTWORKS,
	endOfDay,
	missingArtworks,
	retryLater,
	sessionCounts,
	startOfDay
} from './queue.ts';
import type { ReviewCard, ReviewItem } from '#lib/review/types.ts';

const now = new Date(2026, 9, 16, 9, 0);
const ERAS: EraCode[] = ['antiquity', 'middle_ages', 'early_modern', 'modern'];

function collection(
	count: number,
	overrides: (index: number) => Partial<WallArtwork> = () => ({})
): WallArtwork[] {
	return Array.from({ length: count }, (_, index) =>
		testArtwork(index + 1, `Artwork ${index + 1}`, {
			eraCode: ERAS[index % ERAS.length],
			...overrides(index)
		})
	);
}

function card(artworkId: string, due: Date, overrides: Partial<ReviewCard> = {}): ReviewCard {
	return {
		artworkId,
		due,
		stability: 10,
		difficulty: 5,
		state: 2,
		reps: 3,
		lapses: 0,
		scheduledDays: 10,
		learningSteps: 0,
		lastReview: new Date(due.getTime() - 10 * 24 * 60 * 60 * 1000),
		...overrides
	};
}

describe('review queue', () => {
	it('bounds the day by the local midnight', () => {
		expect(startOfDay(now)).toEqual(new Date(2026, 9, 16));
		expect(endOfDay(now)).toEqual(new Date(2026, 9, 17));
	});

	it('needs 20 artworks with an image and says how many are missing', () => {
		const artworks = collection(22, (index) => ({ hasImage: index >= 4 }));
		expect(missingArtworks(artworks)).toBe(2);
		expect(sessionCounts({ artworks, cards: new Map(), now, newToday: 0 })).toEqual({
			known: 0,
			fresh: 0
		});
		expect(missingArtworks(collection(MIN_ARTWORKS))).toBe(0);
	});

	it('counts the artworks due today and the new ones a session takes', () => {
		const artworks = collection(30);
		const cards = new Map([
			['artwork-5', card('artwork-5', new Date(2026, 9, 16, 20, 0))],
			['artwork-6', card('artwork-6', new Date(2026, 9, 10))],
			['artwork-7', card('artwork-7', new Date(2026, 9, 17, 1, 0))]
		]);
		expect(sessionCounts({ artworks, cards, now, newToday: 0 })).toEqual({ known: 2, fresh: 10 });
	});

	it('limits new artworks to 10 a day, counting those already started today', () => {
		const artworks = collection(30);
		expect(sessionCounts({ artworks, cards: new Map(), now, newToday: 7 })).toEqual({
			known: 0,
			fresh: 3
		});
		expect(sessionCounts({ artworks, cards: new Map(), now, newToday: 12 })).toEqual({
			known: 0,
			fresh: 0
		});
	});

	it('caps a session at 20 artworks, due ones first', () => {
		const artworks = collection(40);
		const cards = new Map(
			artworks
				.slice(0, 25)
				.map((artwork, index) => [artwork.id, card(artwork.id, new Date(2026, 8, 1 + index))])
		);
		expect(sessionCounts({ artworks, cards, now, newToday: 0 })).toEqual({ known: 20, fresh: 0 });
	});

	it('counts only artworks with an image', () => {
		const artworks = collection(25, (index) => ({ hasImage: index !== 0 }));
		expect(sessionCounts({ artworks, cards: new Map(), now, newToday: 0 }).fresh).toBe(10);
		expect(
			sessionCounts({ artworks: artworks.slice(0, 20), cards: new Map(), now, newToday: 0 })
		).toEqual({ known: 0, fresh: 0 });
	});

	it('takes the size of a session and the new artworks a day from the preferences', () => {
		const artworks = collection(40);
		expect(
			sessionCounts({
				artworks,
				cards: new Map(),
				now,
				newToday: 0,
				sessionSize: 30,
				newPerDay: 15
			})
		).toEqual({ known: 0, fresh: 15 });
		expect(sessionCounts({ artworks, cards: new Map(), now, newToday: 3, newPerDay: 5 })).toEqual({
			known: 0,
			fresh: 2
		});
		const due = new Map(
			artworks
				.slice(0, 25)
				.map((artwork, index) => [artwork.id, card(artwork.id, new Date(2026, 8, 1 + index))])
		);
		expect(sessionCounts({ artworks, cards: due, now, newToday: 0, sessionSize: 10 })).toEqual({
			known: 10,
			fresh: 0
		});
		expect(sessionCounts({ artworks, cards: due, now, newToday: 0, sessionSize: 40 })).toEqual({
			known: 25,
			fresh: 10
		});
	});

	it('brings an artwork back after three to five others', () => {
		const queue: ReviewItem[] = collection(10).map((artwork) => ({
			artwork,
			card: null,
			mode: 'flashcard'
		}));
		const again = { ...queue[1] };
		expect(retryLater(queue, 1, again, () => 0).indexOf(again)).toBe(5);
		expect(retryLater(queue, 1, again, () => 0.99).indexOf(again)).toBe(7);
		expect(retryLater(queue, 8, again, () => 0).indexOf(again)).toBe(10);
	});
});
