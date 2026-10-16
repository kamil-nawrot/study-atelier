import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testReviewCard } from '#lib/testing/review.ts';
import {
	estimateMinutes,
	formatInterval,
	formatWhen,
	memoryByEra,
	nextWaiting,
	sameScope,
	scopeArtworks,
	scopeOptions,
	summaryGroups,
	troubles,
	waitingTomorrow
} from './overview.ts';
import type { ReviewCard, ReviewItem } from './types.ts';

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

	function large(count: number, values: Partial<WallArtwork>): WallArtwork[] {
		return Array.from({ length: count }, (_, index) =>
			testArtwork(100 + index, `Large ${index}`, values)
		);
	}

	it('offers the whole collection, every era and the periods and styles with enough artworks', () => {
		const pool = [
			...large(24, { eraCode: 'early_modern', period: 'Baroque', styles: ['Caravaggism'] }),
			...large(21, {
				eraCode: 'early_modern',
				period: 'Renaissance',
				styles: ['High Renaissance']
			}),
			...large(3, { eraCode: 'antiquity', period: 'Classical', styles: ['Doric'] })
		];

		expect(scopeOptions(pool)).toEqual([
			{ kind: 'all' },
			{ kind: 'era', code: 'antiquity' },
			{ kind: 'era', code: 'early_modern' },
			{ kind: 'period', name: 'Baroque' },
			{ kind: 'period', name: 'Renaissance' },
			{ kind: 'style', name: 'Caravaggism' },
			{ kind: 'style', name: 'High Renaissance' }
		]);
	});

	it('offers the eras even when no period or style has enough artworks', () => {
		expect(scopeOptions(artworks)).toEqual([
			{ kind: 'all' },
			{ kind: 'era', code: 'middle_ages' },
			{ kind: 'era', code: 'early_modern' }
		]);
	});

	it('counts only artworks with an image for the scopes it offers', () => {
		const withoutImages = large(25, { eraCode: 'modern', period: 'Baroque', hasImage: false });

		expect(scopeOptions(withoutImages)).toEqual([{ kind: 'all' }]);
	});

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
	it('counts per era the artworks remembered for longer than a week', () => {
		const artworks = collection(4, (index) => ({
			eraCode: index < 3 ? 'early_modern' : 'modern',
			hasImage: index !== 2
		}));
		const cards = cardsFor([
			['artwork-1', testReviewCard('artwork-1', days(9), { stability: 12 })],
			['artwork-2', testReviewCard('artwork-2', days(2), { stability: 3 })]
		]);

		expect(memoryByEra(artworks, cards)).toEqual([
			{ code: 'early_modern', remembered: 1, total: 2 },
			{ code: 'modern', remembered: 0, total: 1 }
		]);
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

	it('names the interval under a rating', () => {
		expect(formatInterval(new Date(2026, 9, 16, 9, 10), now)).toBe(m.review.interval.today);
		expect(formatInterval(days(1), now)).toBe(m.review.interval.tomorrow);
		expect(formatInterval(days(5, 23), now)).toBe(m.review.interval.days(5));
	});

	it('estimates about 25 seconds per artwork, at least a minute', () => {
		expect(estimateMinutes(1)).toBe(1);
		expect(estimateMinutes(14)).toBe(6);
		expect(estimateMinutes(20)).toBe(8);
	});

	it('counts what waits tomorrow with a fresh daily limit of new artworks', () => {
		const artworks = collection(30);
		const cards = cardsFor(
			artworks
				.slice(0, 15)
				.map((artwork, index) => [
					artwork.id,
					testReviewCard(artwork.id, index < 4 ? days(1) : days(4))
				])
		);

		expect(waitingTomorrow(artworks, cards, now)).toBe(14);
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
