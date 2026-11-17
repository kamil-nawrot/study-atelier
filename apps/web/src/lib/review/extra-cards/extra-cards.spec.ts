import { describe, expect, it } from 'vitest';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import { extraOutcome } from './extra-cards.ts';

const now = new Date('2026-11-16T12:00:00');

function card(id: string, due: string): ExtraCard {
	return {
		id,
		termId: id,
		symbolId: null,
		eventId: null,
		due: new Date(due),
		stability: 2,
		difficulty: 5,
		state: 2,
		reps: 1,
		lapses: 0,
		scheduledDays: 2,
		learningSteps: 0,
		lastReview: new Date('2026-11-10T12:00:00'),
		lastRating: 2
	};
}

const older = card('older', '2026-11-01T08:00:00');

describe('extra cards', () => {
	it('schedules a right answer as Prawie and a wrong one as Nie wiem', () => {
		const right = extraOutcome(null, true, now);
		const wrong = extraOutcome(older, false, now);

		expect(right.lastRating).toBe(2);
		expect(wrong.lastRating).toBe(1);
		expect(wrong.lapses).toBe(1);
		expect(right.due.getTime()).toBeGreaterThan(now.getTime());
	});
});
