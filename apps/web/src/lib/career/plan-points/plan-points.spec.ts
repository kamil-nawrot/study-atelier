import { describe, expect, it } from 'vitest';
import { planPoints, streakBonus } from './plan-points.ts';

describe('plan points', () => {
	it('adds five percent for each further day of the streak, at most half', () => {
		expect([1, 2, 11, 30].map(streakBonus)).toEqual([0, 0.05, 0.5, 0.5]);
	});

	it('gives ten points for a whole plan, more with a streak', () => {
		expect(planPoints(1, 1)).toBe(10);
		expect(planPoints(1, 12)).toBe(15);
		expect(planPoints(0.5, 3)).toBe(6);
	});
});
