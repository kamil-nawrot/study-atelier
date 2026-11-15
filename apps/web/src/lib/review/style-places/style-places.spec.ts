import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import type { ReviewCounts } from '#lib/review/types/review-counts.ts';
import { roundWaiting, stylePlaces } from './style-places.ts';

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

describe('round waiting', () => {
	const counts = (changes: Partial<ReviewCounts>): ReviewCounts => ({
		due: 0,
		newAvailable: 0,
		newToday: 0,
		withImage: 40,
		styleWaiting: 0,
		...changes
	});

	it('caps the due artworks at one round', () => {
		expect(roundWaiting(counts({ due: 35 }), defaultPreferences)).toBe(20);
	});

	it('adds the new artworks that fit the daily limit and the rest of the round', () => {
		expect(roundWaiting(counts({ due: 5, newAvailable: 30 }), defaultPreferences)).toBe(15);
		expect(
			roundWaiting(counts({ due: 4, newAvailable: 30, newToday: 3 }), defaultPreferences)
		).toBe(11);
		expect(roundWaiting(counts({ due: 15, newAvailable: 30 }), defaultPreferences)).toBe(20);
	});

	it('follows the session size of the preferences', () => {
		const preferences = { ...defaultPreferences, reviewSessionSize: 30 };
		expect(roundWaiting(counts({ due: 35 }), preferences)).toBe(30);
	});

	it('leaves out the places of the style questions', () => {
		const preferences = { ...defaultPreferences, reviewSessionSize: 30 };
		expect(roundWaiting(counts({ due: 35, styleWaiting: 10 }), preferences)).toBe(24);
		expect(roundWaiting(counts({ due: 35, styleWaiting: 2 }), preferences)).toBe(28);
		expect(
			roundWaiting(counts({ due: 35, styleWaiting: 10 }), {
				...preferences,
				reviewForm: 'flashcards'
			})
		).toBe(30);
		expect(
			roundWaiting(counts({ due: 35, styleWaiting: 10 }), {
				...preferences,
				reviewQuizKinds: preferences.reviewQuizKinds.filter((kind) => kind !== 'quiz_style')
			})
		).toBe(30);
	});

	it('shows nothing waiting until the collection has 20 artworks with an image', () => {
		expect(roundWaiting(counts({ newAvailable: 19, withImage: 19 }), defaultPreferences)).toBe(0);
	});
});
