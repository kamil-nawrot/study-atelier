import { describe, expect, it } from 'vitest';
import { tierDate } from './tier-date.ts';

describe('tier date', () => {
	it('writes the day a tier was unlocked in full', () => {
		expect(tierDate(new Date(2026, 9, 12, 15, 0))).toBe('12 października 2026');
	});
});
