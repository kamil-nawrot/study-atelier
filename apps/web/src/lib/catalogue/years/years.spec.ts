import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { formatDate, formatLifeYears, formatYear, formatYearRange, signedYear } from './years.ts';

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

describe('formatLifeYears', () => {
	it('writes both years as a span, approximate when marked', () => {
		expect(formatLifeYears(1452, 1519, false)).toBe('1452–1519');
		expect(formatLifeYears(-480, -430, true)).toBe('ok. 480–430 p.n.e.');
	});

	it('writes a single year as born or died', () => {
		expect(formatLifeYears(1760, null, false)).toBe(m.valuePage.born('1760'));
		expect(formatLifeYears(null, 1519, true)).toBe(m.valuePage.died('ok. 1519'));
	});

	it('writes nothing without years', () => {
		expect(formatLifeYears(null, null, false)).toBeUndefined();
	});
});
