import { describe, expect, it } from 'vitest';
import { formatRecordNumber, formatYear } from './format.ts';

describe('formatRecordNumber', () => {
	it('pads the number to four digits', () => {
		expect(formatRecordNumber(42)).toBe('#0042');
	});

	it('keeps longer numbers whole', () => {
		expect(formatRecordNumber(12345)).toBe('#12345');
	});
});

describe('formatYear', () => {
	it('has no date without a year', () => {
		expect(formatYear(null, false)).toBeUndefined();
	});

	it('shows a year of the common era as it is', () => {
		expect(formatYear(1878, false)).toBe('1878');
	});

	it('marks an approximate year before the common era', () => {
		expect(formatYear(-150, true)).toBe('ok. 150 p.n.e.');
	});
});
