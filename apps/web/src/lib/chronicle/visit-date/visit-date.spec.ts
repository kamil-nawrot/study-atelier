import { describe, expect, it } from 'vitest';
import {
	dateFromParts,
	dateParts,
	isVisitDate,
	monthNames,
	ticketDate,
	visitDateFrom,
	visitDateName,
	visitWeekday,
	visitYear
} from './visit-date.ts';

describe('dateFromParts', () => {
	it('reads a day, a month or a year', () => {
		expect(dateFromParts({ day: '12', month: '10', year: '2026' })).toEqual({
			on: '2026-10-12',
			precision: 'day'
		});
		expect(dateFromParts({ day: '', month: '3', year: '2026' })).toEqual({
			on: '2026-03-01',
			precision: 'month'
		});
		expect(dateFromParts({ day: ' ', month: '', year: ' 2019 ' })).toEqual({
			on: '2019-01-01',
			precision: 'year'
		});
	});

	it('needs a year of four digits', () => {
		expect(dateFromParts({ day: '12', month: '10', year: '' })).toBe('yearMissing');
		expect(dateFromParts({ day: '', month: '', year: '26' })).toBe('yearInvalid');
		expect(dateFromParts({ day: '', month: '', year: '0999' })).toBe('yearInvalid');
	});

	it('needs a month for a day', () => {
		expect(dateFromParts({ day: '12', month: '', year: '2026' })).toBe('monthMissing');
	});

	it('rejects a day that does not exist', () => {
		expect(dateFromParts({ day: '31', month: '2', year: '2026' })).toBe('dayInvalid');
		expect(dateFromParts({ day: '0', month: '2', year: '2026' })).toBe('dayInvalid');
		expect(dateFromParts({ day: 'x', month: '2', year: '2026' })).toBe('dayInvalid');
		expect(dateFromParts({ day: '29', month: '2', year: '2024' })).toEqual({
			on: '2024-02-29',
			precision: 'day'
		});
	});
});

describe('isVisitDate', () => {
	it('tells a date from a problem', () => {
		expect(isVisitDate({ on: '2026-01-01', precision: 'year' })).toBe(true);
		expect(isVisitDate('yearMissing')).toBe(false);
	});
});

describe('dateParts', () => {
	it('fills in only what is known', () => {
		expect(dateParts({ on: '2026-10-02', precision: 'day' })).toEqual({
			day: '2',
			month: '10',
			year: '2026'
		});
		expect(dateParts({ on: '2026-03-01', precision: 'month' })).toEqual({
			day: '',
			month: '3',
			year: '2026'
		});
		expect(dateParts({ on: '2026-01-01', precision: 'year' })).toEqual({
			day: '',
			month: '',
			year: '2026'
		});
	});
});

describe('monthNames', () => {
	it('names the twelve months', () => {
		const names = monthNames();
		expect(names).toHaveLength(12);
		expect(names[0]).toBe('styczeń');
		expect(names[9]).toBe('październik');
	});
});

describe('visitYear', () => {
	it('gives the year of the visit', () => {
		expect(visitYear({ on: '2019-07-01', precision: 'month' })).toBe(2019);
	});
});

describe('ticketDate', () => {
	it('shows the day with the month and the year under it', () => {
		expect(ticketDate({ on: '2026-10-12', precision: 'day' })).toEqual({
			main: '12',
			sub: 'paź 2026',
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

	it('leaves the year out in the list, where the group names it', () => {
		expect(ticketDate({ on: '2026-10-12', precision: 'day' }, false)).toEqual({
			main: '12',
			sub: 'paź',
			label: '12 października 2026'
		});
		expect(ticketDate({ on: '2026-10-01', precision: 'month' }, false)).toEqual({
			main: 'paź',
			label: 'październik 2026'
		});
		expect(ticketDate({ on: '2026-01-01', precision: 'year' }, false)).toEqual({
			main: '',
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
