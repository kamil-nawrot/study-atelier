import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import {
	formatDate,
	formatDeletedOn,
	formatRecordNumber,
	formatYear,
	formatYearRange,
	parseRecordNumber,
	signedYear
} from './format.ts';

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

describe('formatYearRange', () => {
	it('has no years when a period has no dated artwork', () => {
		expect(formatYearRange(null, null)).toBeUndefined();
	});

	it('shows one year when the bounds are equal', () => {
		expect(formatYearRange(1503, 1503)).toBe('1503');
	});

	it('shows both bounds, also across the common era', () => {
		expect(formatYearRange(-450, 120)).toBe(m.atelier.yearRange('450 p.n.e.', '120'));
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

describe('signedYear', () => {
	it('keeps no year as no year and signs a year before the common era', () => {
		expect(signedYear(null, true)).toBeNull();
		expect(signedYear(150, true)).toBe(-150);
		expect(signedYear(150, false)).toBe(150);
	});
});

describe('formatDate', () => {
	it('has no date without an end year', () => {
		expect(formatDate(null, null, false)).toBeUndefined();
	});

	it('shows a single year, also when both ends are equal', () => {
		expect(formatDate(null, 1503, true)).toBe('ok. 1503');
		expect(formatDate(1503, 1503, false)).toBe('1503');
	});

	it('writes a year span compactly on one side of the turn of the eras', () => {
		expect(formatDate(1503, 1519, false)).toBe('1503–1519');
		expect(formatDate(1503, 1519, true)).toBe('ok. 1503–1519');
		expect(formatDate(-450, -420, false)).toBe('450–420 p.n.e.');
	});

	it('names both eras when the year span crosses the turn of the eras', () => {
		expect(formatDate(-50, 20, false)).toBe('50 p.n.e. – 20 n.e.');
		expect(formatDate(-50, 20, true)).toBe('ok. 50 p.n.e. – 20 n.e.');
	});
});

describe('formatDeletedOn', () => {
	const now = new Date(2026, 9, 12, 15, 0);

	it('says today for an artwork deleted today', () => {
		expect(formatDeletedOn(new Date(2026, 9, 12, 8, 30).toISOString(), now)).toBe(
			m.trash.deletedOn(m.trash.today)
		);
	});

	it('names the day and month for an earlier day this year', () => {
		expect(formatDeletedOn(new Date(2026, 9, 2, 12, 0).toISOString(), now)).toBe(
			m.trash.deletedOn('2 października')
		);
	});

	it('adds the year for an earlier year', () => {
		expect(formatDeletedOn(new Date(2025, 11, 24, 12, 0).toISOString(), now)).toBe(
			m.trash.deletedOn('24 grudnia 2025')
		);
	});
});
