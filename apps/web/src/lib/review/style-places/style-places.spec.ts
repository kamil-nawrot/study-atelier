import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import { stylePlaces } from './style-places.ts';

const now = new Date(2026, 9, 16, 9, 0);
const artworks = Array.from({ length: 30 }, (_, index) =>
	testArtwork(index + 1, `Artwork ${index + 1}`, { styles: index < 25 ? ['Baroque'] : [] })
);
const known = new Map<string, ReviewCard>(
	artworks.map((artwork) => [artwork.id, testReviewCard(artwork.id, now)])
);
const base = {
	artworks,
	cards: known,
	styleCards: new Map<string, ReviewCard>(),
	now,
	sessionSize: 30,
	form: 'mixed' as const,
	scope: { kind: 'all' as const },
	quizKinds: ['quiz_title' as const, 'quiz_style' as const]
};

describe('style places', () => {
	it('gives the style a fifth of the round', () => {
		expect(stylePlaces(base)).toBe(6);
		expect(stylePlaces({ ...base, sessionSize: 20 })).toBe(4);
		expect(stylePlaces({ ...base, sessionSize: 10 })).toBe(2);
	});

	it('counts only recognised artworks with a style whose style card is new or due', () => {
		const later = new Map(
			artworks
				.slice(0, 23)
				.map((artwork) => [artwork.id, testReviewCard(artwork.id, new Date(2026, 9, 30))])
		);
		expect(stylePlaces({ ...base, styleCards: later })).toBe(2);
		const firstOnly = new Map([['artwork-1', testReviewCard('artwork-1', now)]]);
		expect(stylePlaces({ ...base, cards: firstOnly })).toBe(1);
	});

	it('asks no style in flashcards, in a style scope or with the style quiz off', () => {
		expect(stylePlaces({ ...base, form: 'flashcards' })).toBe(0);
		expect(stylePlaces({ ...base, scope: { kind: 'style', name: 'Baroque' } })).toBe(0);
		expect(stylePlaces({ ...base, quizKinds: ['quiz_title'] })).toBe(0);
	});
});
