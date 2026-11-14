import { describe, expect, it } from 'vitest';
import {
	isTripEnd,
	tripDays,
	tripEndFromParts,
	tripEndParts,
	tripOverline,
	tripTicketDate
} from './trip-date.ts';
import { m } from '#lib/i18n/i18n.ts';

const day = { on: '2026-10-10', precision: 'day' } as const;

describe('tripDays', () => {
	it('counts both ends of a trip, and one day without an end', () => {
		expect(tripDays({ date: day, endsOn: '2026-10-14' })).toBe(5);
		expect(tripDays({ date: day, endsOn: null })).toBe(1);
	});

	it('counts across the change of time in spring', () => {
		expect(tripDays({ date: { on: '2026-03-28', precision: 'day' }, endsOn: '2026-03-30' })).toBe(
			3
		);
	});

	it('has no days without exact dates', () => {
		expect(tripDays({ date: { on: '2026-10-01', precision: 'month' }, endsOn: null })).toBeNull();
	});
});

describe('tripEndFromParts', () => {
	it('takes the month and the year of the start when only the day is given', () => {
		expect(tripEndFromParts(day, { day: '14', month: '', year: '' })).toBe('2026-10-14');
	});

	it('gives no end when the fields are empty or the end is the start', () => {
		expect(tripEndFromParts(day, { day: '', month: '', year: '' })).toBeNull();
		expect(tripEndFromParts(day, { day: '10', month: '10', year: '2026' })).toBeNull();
	});

	it('refuses an end before the start and an end of an approximate start', () => {
		expect(tripEndFromParts(day, { day: '9', month: '10', year: '2026' })).toBe('endBeforeStart');
		expect(
			tripEndFromParts({ on: '2026-10-01', precision: 'month' }, { day: '3', month: '', year: '' })
		).toBe('endApproximate');
	});

	it('asks for the day of an end given without one', () => {
		expect(tripEndFromParts(day, { day: '', month: '11', year: '' })).toBe('endDayMissing');
		expect(tripEndFromParts(day, { day: '', month: '', year: '2027' })).toBe('endDayMissing');
	});

	it('moves an end day before the start day into the next month and year', () => {
		expect(tripEndFromParts(day, { day: '3', month: '', year: '' })).toBe('2026-11-03');
		expect(
			tripEndFromParts({ on: '2026-12-28', precision: 'day' }, { day: '3', month: '', year: '' })
		).toBe('2027-01-03');
		expect(
			tripEndFromParts({ on: '2026-12-28', precision: 'day' }, { day: '3', month: '1', year: '' })
		).toBe('2027-01-03');
	});

	it('refuses a day the month does not have', () => {
		expect(tripEndFromParts(day, { day: '31', month: '11', year: '2026' })).toBe('dayInvalid');
	});
});

describe('isTripEnd', () => {
	it('tells an end from a problem', () => {
		expect(isTripEnd(null)).toBe(true);
		expect(isTripEnd('2026-10-14')).toBe(true);
		expect(isTripEnd('endBeforeStart')).toBe(false);
	});
});

describe('tripEndParts', () => {
	it('splits the end into the fields of the form', () => {
		expect(tripEndParts({ date: day, endsOn: '2026-11-02' })).toEqual({
			day: '2',
			month: '11',
			year: '2026'
		});
		expect(tripEndParts({ date: day, endsOn: null })).toEqual({ day: '', month: '', year: '' });
	});
});

describe('tripTicketDate', () => {
	it('shows the days as a range over the month', () => {
		const date = tripTicketDate({ date: day, endsOn: '2026-10-14' }, false);

		expect(date.main).toBe('10–14');
		expect(date.sub).toMatch(/^paź/);
	});

	it('names both months of a trip across a month', () => {
		const date = tripTicketDate({ date: day, endsOn: '2026-11-02' });

		expect(date.main).toBe('10–2');
		expect(date.sub).toMatch(/^paź.*–lis.* 2026$/);
	});
});

describe('tripOverline', () => {
	it('names the days of a trip, or its month without exact days', () => {
		expect(tripOverline({ date: day, endsOn: '2026-10-14' })).toBe(m.chronicle.trip.overline(5));
		expect(tripOverline({ date: { on: '2026-10-01', precision: 'month' }, endsOn: null })).toMatch(
			/^Podróż · październik 2026$/
		);
	});
});
