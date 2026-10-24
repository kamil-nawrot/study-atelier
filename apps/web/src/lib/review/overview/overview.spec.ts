import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import {
	atelierKnowledge,
	formatWhen,
	freeScopeOptions,
	nextWaiting,
	sameScope,
	scopeArtworks,
	scopeOptions,
	summaryGroups,
	troubles,
	waitingTomorrow
} from './overview.ts';
import type { ReviewCard, ReviewItem } from '#lib/review/types.ts';

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

	let next = 100;

	function large(count: number, values: Partial<WallArtwork>): WallArtwork[] {
		return Array.from({ length: count }, () => {
			next += 1;
			return testArtwork(next, `Large ${next}`, values);
		});
	}

	function dueToday(works: WallArtwork[]): [string, ReviewCard][] {
		return works.map((artwork) => [artwork.id, testReviewCard(artwork.id, days(0, 8))]);
	}

	it('offers the whole collection and a narrower scope only with at least 10 artworks due in it', () => {
		const baroque = large(24, {
			eraCode: 'early_modern',
			period: 'Baroque',
			styles: ['Caravaggism']
		});
		const renaissance = large(21, {
			eraCode: 'early_modern',
			period: 'Renaissance',
			styles: ['High Renaissance']
		});
		const cards = cardsFor([
			...dueToday(baroque.slice(0, 12)),
			...dueToday(renaissance.slice(0, 5))
		]);

		expect(scopeOptions([...baroque, ...renaissance], cards, now)).toEqual([
			{ kind: 'all' },
			{ kind: 'era', code: 'early_modern' },
			{ kind: 'period', name: 'Baroque' },
			{ kind: 'style', name: 'Caravaggism' }
		]);
	});

	it('leaves out a scope with fewer than 20 artworks with an image, however many are due', () => {
		const ancient = large(15, { eraCode: 'antiquity' });
		const unseen = large(25, { eraCode: 'antiquity', hasImage: false });

		expect(scopeOptions([...ancient, ...unseen], cardsFor(dueToday(ancient)), now)).toEqual([
			{ kind: 'all' }
		]);
	});

	it('counts no new artworks towards a scope', () => {
		expect(scopeOptions(large(30, { eraCode: 'modern' }), new Map(), now)).toEqual([
			{ kind: 'all' }
		]);
	});

	it('offers free scopes with at least 20 artworks already reviewed, whatever is due', () => {
		const baroque = large(24, {
			eraCode: 'early_modern',
			period: 'Baroque',
			styles: ['Caravaggism']
		});
		const gothic = large(30, { eraCode: 'middle_ages', period: 'Gothic' });
		const later = (works: WallArtwork[]): [string, ReviewCard][] =>
			works.map((artwork) => [artwork.id, testReviewCard(artwork.id, days(5))]);
		const cards = cardsFor([...later(baroque.slice(0, 21)), ...later(gothic.slice(0, 19))]);

		expect(freeScopeOptions([...baroque, ...gothic], cards)).toEqual([
			{ scope: { kind: 'all' }, count: 40 },
			{ scope: { kind: 'era', code: 'early_modern' }, count: 21 },
			{ scope: { kind: 'period', name: 'Baroque' }, count: 21 },
			{ scope: { kind: 'style', name: 'Caravaggism' }, count: 21 }
		]);
	});

	it('offers no free scope before any artwork was reviewed', () => {
		expect(freeScopeOptions(large(25, { eraCode: 'modern' }), new Map())).toEqual([]);
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
