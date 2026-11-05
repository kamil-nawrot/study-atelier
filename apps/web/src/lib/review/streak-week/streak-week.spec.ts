import { describe, expect, it } from 'vitest';
import { testReviewCard } from '#lib/testing/review/review.ts';
import { reviewedSince, streakWeek, streakWithToday } from './streak-week.ts';

const wednesday = new Date(2026, 10, 4, 21, 0);

describe('streakWeek', () => {
	it('fills the days of a streak that has not reached today yet and leaves today open', () => {
		const week = streakWeek(5, false, wednesday);

		expect(week.map((day) => day.weekday)).toEqual([4, 5, 6, 0, 1, 2, 3]);
		expect(week.map((day) => day.filled)).toEqual([false, true, true, true, true, true, false]);
		expect(week.map((day) => day.today)).toEqual([false, false, false, false, false, false, true]);
	});

	it('counts today in a streak that already holds it', () => {
		expect(streakWeek(2, true, wednesday).map((day) => day.filled)).toEqual([
			false,
			false,
			false,
			false,
			false,
			true,
			true
		]);
	});

	it('fills the whole week for a streak of a week or longer', () => {
		expect(streakWeek(40, false, wednesday).filter((day) => day.filled)).toHaveLength(6);
		expect(streakWeek(40, true, wednesday).every((day) => day.filled)).toBe(true);
	});
});

describe('reviewedSince', () => {
	it('tells whether any card was reviewed since the start of the day', () => {
		const dayStart = new Date(2026, 10, 4);
		const yesterday = testReviewCard('a', wednesday, { lastReview: new Date(2026, 10, 3, 23, 59) });
		const today = testReviewCard('b', wednesday, { lastReview: new Date(2026, 10, 4, 8, 0) });

		expect(reviewedSince([yesterday], dayStart)).toBe(false);
		expect(reviewedSince([yesterday, today], dayStart)).toBe(true);
		expect(reviewedSince([testReviewCard('c', wednesday, { lastReview: null })], dayStart)).toBe(
			false
		);
	});
});

describe('streakWithToday', () => {
	const dayStart = new Date(2026, 10, 4);
	const yesterday = testReviewCard('a', wednesday, { lastReview: new Date(2026, 10, 3, 20, 0) });
	const today = testReviewCard('b', wednesday, { lastReview: new Date(2026, 10, 4, 8, 0) });

	it('adds today when the first round of the day was reviewed after the page loaded', () => {
		expect(streakWithToday({ streak: 5, cards: new Map([['a', yesterday]]) }, true, dayStart)).toBe(
			6
		);
	});

	it('keeps the loaded streak when today was already in it or nothing was reviewed', () => {
		expect(streakWithToday({ streak: 6, cards: new Map([['b', today]]) }, true, dayStart)).toBe(6);
		expect(
			streakWithToday({ streak: 5, cards: new Map([['a', yesterday]]) }, false, dayStart)
		).toBe(5);
	});
});
