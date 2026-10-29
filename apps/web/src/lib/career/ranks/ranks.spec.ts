import { describe, expect, it } from 'vitest';
import { progressToNext, rankOf } from './ranks.ts';

describe('ranks', () => {
	it('starts every learner at the first rank', () => {
		expect(rankOf(0)).toEqual({ level: 1, floor: 0, next: 50 });
	});

	it('reaches a rank at its threshold', () => {
		expect(rankOf(49).level).toBe(1);
		expect(rankOf(50)).toEqual({ level: 2, floor: 50, next: 200 });
		expect(rankOf(1846)).toEqual({ level: 5, floor: 1000, next: 2000 });
	});

	it('has no next rank at the top', () => {
		expect(rankOf(70000)).toEqual({ level: 12, floor: 70000, next: undefined });
		expect(rankOf(250000).level).toBe(12);
	});

	it('measures the way from the current rank to the next', () => {
		expect(progressToNext(1500)).toBe(0.5);
		expect(progressToNext(50)).toBe(0);
		expect(progressToNext(90000)).toBe(1);
	});
});
