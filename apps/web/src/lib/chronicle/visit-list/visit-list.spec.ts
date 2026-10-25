import { describe, expect, it } from 'vitest';
import { openYear, visitsByYear } from './visit-list.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitDate } from '#lib/chronicle/types/visit-date.ts';

function visit(id: string, date: VisitDate): Visit {
	return {
		id,
		place: 'Louvre',
		placeType: 'museum',
		countryCode: 'FR',
		date,
		notes: '',
		artworkIds: []
	};
}

describe('visitsByYear', () => {
	it('groups visits by year, newest first', () => {
		const years = visitsByYear([
			visit('a', { on: '2024-05-03', precision: 'day' }),
			visit('b', { on: '2026-10-12', precision: 'day' }),
			visit('c', { on: '2026-03-01', precision: 'month' })
		]);
		expect(years.map((year) => year.year)).toEqual([2026, 2024]);
		expect(years[0].visits.map((item) => item.id)).toEqual(['b', 'c']);
	});

	it('puts a visit known only to the year or month before the days of that period', () => {
		const years = visitsByYear([
			visit('day', { on: '2026-01-05', precision: 'day' }),
			visit('year', { on: '2026-01-01', precision: 'year' }),
			visit('month', { on: '2026-02-01', precision: 'month' })
		]);
		expect(years[0].visits.map((item) => item.id)).toEqual(['month', 'day', 'year']);
	});

	it('gives no years without visits', () => {
		expect(visitsByYear([])).toEqual([]);
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

	it('opens nothing without visits', () => {
		expect(openYear([], now)).toBeUndefined();
	});
});
