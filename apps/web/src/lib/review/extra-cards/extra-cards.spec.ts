import { describe, expect, it } from 'vitest';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import { dueFirst, extraOutcome, leastAskedKind } from './extra-cards.ts';

const now = new Date('2026-11-16T12:00:00');

function card(id: string, due: string): ExtraCard {
	return {
		id,
		termId: id,
		symbolId: null,
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

const cards = new Map([
	['late', card('late', '2026-11-16T20:00:00')],
	['older', card('older', '2026-11-01T08:00:00')],
	['future', card('future', '2026-11-20T08:00:00')],
	['overdue', card('overdue', '2026-11-12T08:00:00')]
]);

describe('extra cards', () => {
	it('asks the due cards first, the most overdue first, and the new ones in the places left', () => {
		const picked = dueFirst(
			['fresh-a', 'late', 'future', 'overdue', 'older', 'fresh-b'],
			(id) => cards.get(id),
			5,
			now,
			() => 0
		);

		expect(picked.map(({ item }) => item)).toEqual([
			'older',
			'overdue',
			'late',
			'fresh-b',
			'fresh-a'
		]);
		expect(picked[0].card?.id).toBe('older');
		expect(picked[3].card).toBeNull();
	});

	it('leaves no place to a new item while due cards fill the count', () => {
		expect(dueFirst(['fresh', 'overdue', 'older'], (id) => cards.get(id), 2, now)).toEqual([
			{ item: 'older', card: cards.get('older') },
			{ item: 'overdue', card: cards.get('overdue') }
		]);
		expect(dueFirst(['fresh'], () => undefined, 0, now)).toEqual([]);
	});

	it('asks the kind of symbol question asked least recently, a never asked one first', () => {
		expect(leastAskedKind(['symbol', 'meaning', 'attribute'])).toBe('symbol');
		expect(leastAskedKind(['symbol', 'meaning'], { symbol: 10 })).toBe('meaning');
		expect(leastAskedKind(['symbol', 'meaning', 'attribute'], { symbol: 10, meaning: 5 })).toBe(
			'attribute'
		);
		expect(leastAskedKind(['symbol', 'meaning'], { symbol: 10, meaning: 20 })).toBe('symbol');
		expect(leastAskedKind([])).toBeUndefined();
	});

	it('schedules a right answer as Prawie and a wrong one as Nie wiem', () => {
		const right = extraOutcome(null, true, now);
		const wrong = extraOutcome(cards.get('older') ?? null, false, now);

		expect(right.lastRating).toBe(2);
		expect(wrong.lastRating).toBe(1);
		expect(wrong.lapses).toBe(1);
		expect(right.due.getTime()).toBeGreaterThan(now.getTime());
	});
});
