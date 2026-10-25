import { describe, expect, it } from 'vitest';
import {
	parseVisitDate,
	ticketDate,
	visitDateFrom,
	visitDateName,
	visitDateText,
	visitWeekday,
	visitYear
} from './visit-date.ts';

describe('parseVisitDate', () => {
	it('reads a day, a month or a year', () => {
		expect(parseVisitDate('12.10.2026')).toEqual({ on: '2026-10-12', precision: 'day' });
		expect(parseVisitDate('10.2026')).toEqual({ on: '2026-10-01', precision: 'month' });
		expect(parseVisitDate('2026')).toEqual({ on: '2026-01-01', precision: 'year' });
	});

	it('takes single digits and spaces', () => {
		expect(parseVisitDate(' 3.5.2024 ')).toEqual({ on: '2024-05-03', precision: 'day' });
		expect(parseVisitDate('5. 2024')).toEqual({ on: '2024-05-01', precision: 'month' });
	});

	it('rejects a day that does not exist', () => {
		expect(parseVisitDate('31.02.2026')).toBeUndefined();
		expect(parseVisitDate('29.02.2025')).toBeUndefined();
		expect(parseVisitDate('29.02.2024')).toEqual({ on: '2024-02-29', precision: 'day' });
	});

	it('rejects a month that does not exist and a short or early year', () => {
		expect(parseVisitDate('13.2026')).toBeUndefined();
		expect(parseVisitDate('0.2026')).toBeUndefined();
		expect(parseVisitDate('26')).toBeUndefined();
		expect(parseVisitDate('0999')).toBeUndefined();
	});

	it('rejects other formats and an empty field', () => {
		expect(parseVisitDate('2026-10-12')).toBeUndefined();
		expect(parseVisitDate('październik 2026')).toBeUndefined();
		expect(parseVisitDate('')).toBeUndefined();
	});
});

describe('visitDateText', () => {
	it('writes the date back as far as it is known', () => {
		expect(visitDateText({ on: '2026-10-02', precision: 'day' })).toBe('02.10.2026');
		expect(visitDateText({ on: '2026-03-01', precision: 'month' })).toBe('03.2026');
		expect(visitDateText({ on: '2026-01-01', precision: 'year' })).toBe('2026');
	});
});

describe('visitYear', () => {
	it('gives the year of the visit', () => {
		expect(visitYear({ on: '2019-07-01', precision: 'month' })).toBe(2019);
	});
});

describe('ticketDate', () => {
	it('shows the day with the month under it', () => {
		expect(ticketDate({ on: '2026-10-12', precision: 'day' })).toEqual({
			main: '12',
			sub: 'paź',
			label: '12 października 2026'
		});
	});

	it('shows the month with the year under it', () => {
		expect(ticketDate({ on: '2026-10-01', precision: 'month' })).toEqual({
			main: 'paź',
			sub: '2026',
			label: 'październik 2026'
		});
	});

	it('shows the year alone', () => {
		expect(ticketDate({ on: '2026-01-01', precision: 'year' })).toEqual({
			main: '2026',
			label: '2026'
		});
	});
});

describe('visitDateName', () => {
	const now = new Date(2026, 9, 25);

	it('leaves out the year of this year', () => {
		expect(visitDateName({ on: '2026-10-12', precision: 'day' }, now)).toBe('12 października');
		expect(visitDateName({ on: '2024-10-12', precision: 'day' }, now)).toBe('12 października 2024');
	});

	it('names a month or a year', () => {
		expect(visitDateName({ on: '2026-10-01', precision: 'month' }, now)).toBe('październik 2026');
		expect(visitDateName({ on: '2019-01-01', precision: 'year' }, now)).toBe('2019');
	});
});

describe('visitDateFrom', () => {
	const now = new Date(2026, 9, 25);

	it('reads after "z" for a day, a month and a year', () => {
		expect(visitDateFrom({ on: '2026-10-12', precision: 'day' }, now)).toBe('12 października');
		expect(visitDateFrom({ on: '2026-10-01', precision: 'month' }, now)).toBe('października 2026');
		expect(visitDateFrom({ on: '2019-01-01', precision: 'year' }, now)).toBe('2019 roku');
	});
});

describe('visitWeekday', () => {
	it('names the weekday of a known day only', () => {
		expect(visitWeekday({ on: '2026-10-12', precision: 'day' })).toBe('poniedziałek');
		expect(visitWeekday({ on: '2026-10-01', precision: 'month' })).toBeUndefined();
	});
});
