import { describe, expect, it } from 'vitest';
import { formatRecordNumber, parseRecordNumber } from './record-number.ts';

describe('formatRecordNumber', () => {
	it('pads the number to four digits', () => {
		expect(formatRecordNumber(42)).toBe('#0042');
	});

	it('keeps longer numbers whole', () => {
		expect(formatRecordNumber(12345)).toBe('#12345');
	});
});

describe('parseRecordNumber', () => {
	it('reads a record number from the URL', () => {
		expect(parseRecordNumber('42')).toBe(42);
		expect(parseRecordNumber('0042')).toBe(42);
	});

	it('rejects anything that is not a positive whole number', () => {
		for (const text of ['', '0', '-1', '4.2', '42a', 'new', '99999999999999999999']) {
			expect(parseRecordNumber(text)).toBeNull();
		}
	});
});
