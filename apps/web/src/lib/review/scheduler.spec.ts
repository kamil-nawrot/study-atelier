import { describe, expect, it } from 'vitest';
import { previewDue, quizRating, schedule } from './scheduler.ts';

const now = new Date('2026-10-16T09:00:00Z');
const day = 24 * 60 * 60 * 1000;

describe('scheduler', () => {
	it('starts a new artwork in learning and brings a forgotten one back the same day', () => {
		const card = schedule('artwork-1', null, 1, now);
		expect(card.artworkId).toBe('artwork-1');
		expect(card.state).toBe(1);
		expect(card.reps).toBe(1);
		expect(card.lastReview).toEqual(now);
		expect(card.due.getTime() - now.getTime()).toBeLessThan(day);
	});

	it('spaces the next review further for a better rating', () => {
		const learnt = schedule('artwork-1', schedule('artwork-1', null, 3, now), 3, now);
		const later = new Date(learnt.due.getTime());
		const due = previewDue(learnt, later);
		expect(due[1].getTime()).toBeLessThan(due[2].getTime());
		expect(due[2].getTime()).toBeLessThanOrEqual(due[3].getTime());
		expect(due[3].getTime() - later.getTime()).toBeGreaterThanOrEqual(day);
	});

	it('counts a forgotten artwork as a lapse once it was in review', () => {
		let card = schedule('artwork-1', null, 3, now);
		card = schedule('artwork-1', card, 3, card.due);
		expect(card.state).toBe(2);
		const forgotten = schedule('artwork-1', card, 1, card.due);
		expect(forgotten.lapses).toBe(1);
		expect(forgotten.state).toBe(3);
	});

	it('counts a right quiz answer as hard and a wrong one as forgotten', () => {
		expect(quizRating(true)).toBe(2);
		expect(quizRating(false)).toBe(1);
	});
});
