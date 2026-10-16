import { describe, expect, it } from 'vitest';
import { outcomes, quizRating, schedule } from './scheduler.ts';
import type { ReviewCard } from './types.ts';

const now = new Date('2026-10-16T09:00:00Z');
const day = 24 * 60 * 60 * 1000;

describe('scheduler', () => {
	it('schedules a new artwork a day or more ahead for every rating', () => {
		const card = schedule('artwork-1', null, 1, now);
		expect(card.artworkId).toBe('artwork-1');
		expect(card.state).toBe(2);
		expect(card.reps).toBe(1);
		expect(card.lastReview).toEqual(now);
		for (const next of Object.values(outcomes('artwork-1', null, now))) {
			expect(next.due.getTime() - now.getTime()).toBeGreaterThanOrEqual(day);
		}
	});

	it('moves an artwork stuck in learning to a review a day or more ahead', () => {
		const stuck: ReviewCard = {
			artworkId: 'artwork-1',
			due: now,
			stability: 1.2,
			difficulty: 6,
			state: 1,
			reps: 6,
			lapses: 0,
			scheduledDays: 0,
			learningSteps: 0,
			lastReview: new Date(now.getTime() - 6 * 60 * 1000)
		};
		const card = schedule('artwork-1', stuck, 2, now);
		expect(card.state).toBe(2);
		expect(card.due.getTime() - now.getTime()).toBeGreaterThanOrEqual(day);
	});

	it('spaces the next review further for a better rating', () => {
		const learnt = schedule('artwork-1', schedule('artwork-1', null, 3, now), 3, now);
		const later = new Date(learnt.due.getTime());
		const next = outcomes('artwork-1', learnt, later);
		expect(next[1].due.getTime()).toBeLessThan(next[2].due.getTime());
		expect(next[2].due.getTime()).toBeLessThanOrEqual(next[3].due.getTime());
		expect(next[3].due.getTime() - later.getTime()).toBeGreaterThanOrEqual(day);
		expect(next[3].artworkId).toBe('artwork-1');
		expect(next[3].reps).toBe(learnt.reps + 1);
	});

	it('counts a forgotten artwork as a lapse and brings it back the next day', () => {
		const card = schedule('artwork-1', null, 3, now);
		const forgotten = schedule('artwork-1', card, 1, card.due);
		expect(forgotten.lapses).toBe(1);
		expect(forgotten.due.getTime() - card.due.getTime()).toBeGreaterThanOrEqual(day);
	});

	it('counts a right quiz answer as hard and a wrong one as forgotten', () => {
		expect(quizRating(true)).toBe(2);
		expect(quizRating(false)).toBe(1);
	});
});
