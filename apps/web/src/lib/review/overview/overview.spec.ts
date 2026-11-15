import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import {
	atelierKnowledge,
	describeArtwork,
	formatWhen,
	nextWaiting,
	sameScope,
	scopeArtworks,
	summaryGroups,
	troubles
} from './overview.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';

const now = new Date(2026, 9, 16, 9, 0);

function days(count: number, hour = 9): Date {
	return new Date(2026, 9, 16 + count, hour, 0);
}

function collection(
	count: number,
	overrides: (index: number) => Partial<WallArtwork> = () => ({})
): WallArtwork[] {
	return Array.from({ length: count }, (_, index) =>
		testArtwork(index + 1, `Artwork ${index + 1}`, overrides(index))
	);
}

function cardsFor(entries: [string, ReviewCard][]): Map<string, ReviewCard> {
	return new Map(entries);
}

describe('review scopes', () => {
	const artworks = collection(8, (index) => ({
		eraCode: index < 5 ? 'early_modern' : 'middle_ages',
		period: ['Baroque', 'Baroque', 'Baroque', 'Renaissance', 'Renaissance', 'Gothic', null, null][
			index
		],
		styles: index < 2 ? ['Caravaggism'] : index < 5 ? ['High Renaissance'] : []
	}));

	it('narrows the artworks to the chosen scope', () => {
		expect(scopeArtworks(artworks, { kind: 'all' })).toHaveLength(8);
		expect(
			scopeArtworks(artworks, { kind: 'era', code: 'middle_ages' }).map((a) => a.number)
		).toEqual([6, 7, 8]);
		expect(
			scopeArtworks(artworks, { kind: 'period', name: 'Renaissance' }).map((a) => a.number)
		).toEqual([4, 5]);
		expect(
			scopeArtworks(artworks, { kind: 'style', name: 'Caravaggism' }).map((a) => a.number)
		).toEqual([1, 2]);
	});

	it('compares scopes by kind and value', () => {
		expect(
			sameScope({ kind: 'period', name: 'Baroque' }, { kind: 'period', name: 'Baroque' })
		).toBe(true);
		expect(sameScope({ kind: 'period', name: 'Baroque' }, { kind: 'style', name: 'Baroque' })).toBe(
			false
		);
		expect(sameScope({ kind: 'era', code: 'modern' }, { kind: 'era', code: 'contemporary' })).toBe(
			false
		);
		expect(sameScope({ kind: 'all' }, { kind: 'all' })).toBe(true);
	});
});

describe('review overview', () => {
	it('counts the settled, the learning and the new artworks with an image', () => {
		const artworks = collection(5, (index) => ({ hasImage: index !== 4 }));
		const cards = cardsFor([
			['artwork-1', testReviewCard('artwork-1', days(9), { stability: 12 })],
			['artwork-2', testReviewCard('artwork-2', days(2), { stability: 3 })]
		]);

		expect(atelierKnowledge(artworks, cards)).toEqual({ settled: 1, learning: 1, fresh: 2 });
	});

	it('lists up to four artworks that were forgotten lately, the latest first', () => {
		const artworks = collection(6);
		const cards = cardsFor(
			artworks.map((artwork, index) => [
				artwork.id,
				testReviewCard(artwork.id, days(1), {
					lapses: index === 0 ? 0 : 1,
					lastReview: days(-index)
				})
			])
		);

		expect(troubles(artworks, cards).map((artwork) => artwork.number)).toEqual([2, 3, 4, 5]);
	});

	it('lists an artwork whose last scheduling answer was not known', () => {
		const artworks = collection(2);
		const cards = cardsFor([
			['artwork-1', testReviewCard('artwork-1', days(1), { lastRating: 1 })],
			['artwork-2', testReviewCard('artwork-2', days(1))]
		]);

		expect(troubles(artworks, cards).map((artwork) => artwork.number)).toEqual([1]);
	});

	it('says when the next artworks wait once everything for today is done', () => {
		const artworks = collection(2);
		const cards = cardsFor([
			['artwork-1', testReviewCard('artwork-1', days(3))],
			['artwork-2', testReviewCard('artwork-2', days(5))]
		]);

		const next = nextWaiting(artworks, cards, now);

		expect(next).toEqual(days(3));
		expect(formatWhen(days(1), now)).toBe('jutro');
		expect(formatWhen(days(3), now)).toBe('za 3 dni');
	});

	it('waits for tomorrow when new artworks are left over the daily limit', () => {
		const artworks = collection(2);
		const cards = cardsFor([['artwork-1', testReviewCard('artwork-1', days(5))]]);

		expect(nextWaiting(artworks, cards, now)).toEqual(days(1, 0));
	});
});

describe('summary groups', () => {
	function item(number: number): ReviewItem {
		return { artwork: testArtwork(number, `Artwork ${number}`), card: null, mode: 'flashcard' };
	}

	it('groups each artwork by its first rating and leaves out empty groups', () => {
		const groups = summaryGroups([
			{ item: item(1), rating: 1 },
			{ item: item(2), rating: 3 },
			{ item: item(3), rating: 3 },
			{ item: item(1), rating: 3 }
		]);

		expect(groups.map((group) => [group.rating, group.artworks.map((a) => a.number)])).toEqual([
			[1, [1]],
			[3, [2, 3]]
		]);
	});
});

describe('artwork description', () => {
	it('joins the title with the authors', () => {
		const artwork = testArtwork(1, 'Mona Lisa', { authors: ['Leonardo da Vinci'] });

		expect(describeArtwork(artwork)).toBe('Mona Lisa, Leonardo da Vinci');
	});
});
