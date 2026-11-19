import { describe, expect, it } from 'vitest';
import { matchingVisits, openYear, visitsByYear } from './visit-list.ts';
import { testTrip, testVisit } from '#lib/testing/chronicle/chronicle.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitDate } from '#lib/chronicle/types/visit-date.ts';

function visit(id: string, date: VisitDate, tripId: string | null = null): Visit {
	return testVisit({ id, place: 'Louvre', date, notes: '', tripId });
}

describe('visitsByYear', () => {
	it('groups visits by year, newest first', () => {
		const years = visitsByYear([
			visit('a', { on: '2024-05-03', precision: 'day' }),
			visit('b', { on: '2026-10-12', precision: 'day' }),
			visit('c', { on: '2026-03-01', precision: 'month' })
		]);
		expect(years.map((year) => year.year)).toEqual([2026, 2024]);
		expect(years[0].entries.map((item) => item.visit.id)).toEqual(['b', 'c']);
	});

	it('puts a visit known only to the year or month before the days of that period', () => {
		const years = visitsByYear([
			visit('day', { on: '2026-01-05', precision: 'day' }),
			visit('year', { on: '2026-01-01', precision: 'year' }),
			visit('month', { on: '2026-02-01', precision: 'month' })
		]);
		expect(years[0].entries.map((item) => item.visit.id)).toEqual(['month', 'day', 'year']);
	});

	it('puts the visits of a trip under it, in the order of the days, and counts them', () => {
		const trip = testTrip({ id: 'trip', date: { on: '2026-10-10', precision: 'day' } });
		const years = visitsByYear([
			visit('after', { on: '2026-11-02', precision: 'day' }),
			visit('second', { on: '2026-10-13', precision: 'day' }, 'trip'),
			visit('first', { on: '2026-10-12', precision: 'day' }, 'trip'),
			trip,
			visit('lost', { on: '2026-10-11', precision: 'day' }, 'deleted-trip')
		]);
		expect(years[0].entries.map((item) => item.visit.id)).toEqual(['after', 'lost', 'trip']);
		expect(years[0].entries[2].visits.map((item) => item.id)).toEqual(['first', 'second']);
		expect(years[0].count).toBe(5);
	});

	it('places a trip by its start date', () => {
		const years = visitsByYear([
			testTrip({ id: 'trip', date: { on: '2025-12-30', precision: 'day' }, endsOn: '2026-01-03' }),
			visit('later', { on: '2026-01-02', precision: 'day' }, 'trip')
		]);
		expect(years.map((year) => year.year)).toEqual([2025]);
		expect(years[0].count).toBe(2);
	});

	it('gives no years without visits', () => {
		expect(visitsByYear([])).toEqual([]);
	});
});

describe('visitsByYear in the oldest order', () => {
	it('puts the oldest year and visit first, and keeps the days of a trip in order', () => {
		const trip = testTrip({ id: 'trip', date: { on: '2024-05-01', precision: 'day' } });
		const years = visitsByYear(
			[
				visit('new', { on: '2026-10-12', precision: 'day' }),
				visit('second', { on: '2024-05-03', precision: 'day' }, 'trip'),
				visit('first', { on: '2024-05-02', precision: 'day' }, 'trip'),
				trip,
				visit('mid', { on: '2024-08-01', precision: 'day' })
			],
			'oldest'
		);
		expect(years.map((year) => year.year)).toEqual([2024, 2026]);
		expect(years[0].entries.map((item) => item.visit.id)).toEqual(['trip', 'mid']);
		expect(years[0].entries[0].visits.map((item) => item.id)).toEqual(['first', 'second']);
	});
});

describe('matchingVisits', () => {
	const trip = testTrip({
		id: 'trip',
		place: 'Ateny',
		date: { on: '2026-10-10', precision: 'day' }
	});
	const acropolis = testVisit({ id: 'acropolis', place: 'Akropol', tripId: 'trip' });
	const museum = testVisit({ id: 'museum', place: 'Muzeum Narodowe', tripId: 'trip' });
	const louvre = testVisit({ id: 'louvre', place: 'Luwr' });
	const all = [trip, acropolis, museum, louvre];
	const ids = (list: readonly Visit[]): string[] => list.map(({ id }) => id);

	it('keeps everything without a query', () => {
		expect(matchingVisits(all, '  ')).toBe(all);
	});

	it('matches the name of the place, ignoring case and diacritics', () => {
		expect(ids(matchingVisits(all, 'LUWR'))).toEqual(['louvre']);
		expect(ids(matchingVisits([testVisit({ id: 'x', place: 'Musée d’Orsay' })], 'musee'))).toEqual([
			'x'
		]);
	});

	it('keeps all the visits of a trip whose place matches', () => {
		expect(ids(matchingVisits(all, 'ateny'))).toEqual(['trip', 'acropolis', 'museum']);
	});

	it('keeps the trip of a matching visit, with only the matching visits', () => {
		expect(ids(matchingVisits(all, 'akropol'))).toEqual(['trip', 'acropolis']);
	});

	it('gives nothing when nothing matches', () => {
		expect(matchingVisits(all, 'Prado')).toEqual([]);
	});
});

describe('openYear', () => {
	const now = new Date(2026, 9, 25);

	it('opens this year when it has visits', () => {
		const years = visitsByYear([
			visit('future', { on: '2027-01-01', precision: 'year' }),
			visit('now', { on: '2026-03-01', precision: 'month' })
		]);
		expect(openYear(years, now)).toBe(2026);
	});

	it('opens the newest year otherwise', () => {
		const years = visitsByYear([
			visit('old', { on: '2019-01-01', precision: 'year' }),
			visit('newer', { on: '2024-05-03', precision: 'day' })
		]);
		expect(openYear(years, now)).toBe(2024);
	});

	it('opens the newest year also when the oldest come first', () => {
		const years = visitsByYear(
			[
				visit('old', { on: '2019-01-01', precision: 'year' }),
				visit('newer', { on: '2024-05-03', precision: 'day' })
			],
			'oldest'
		);
		expect(openYear(years, now)).toBe(2024);
	});

	it('opens nothing without visits', () => {
		expect(openYear([], now)).toBeUndefined();
	});
});
