import { describe, expect, it } from 'vitest';
import {
	archivedSince,
	changedOn,
	shortDate
} from '#lib/exhibitions/exhibition-dates/exhibition-dates.ts';
import { m } from '#lib/i18n/i18n.ts';

const now = new Date('2026-11-06T12:00:00');

describe('changedOn', () => {
	it('says today for a change made today', () => {
		expect(changedOn('2026-11-06T08:00:00', now)).toBe(m.exhibitions.changedToday);
	});

	it('gives the day and the short month for an earlier day of this year', () => {
		expect(changedOn('2026-03-04T08:00:00', now)).toBe('4 mar');
	});

	it('adds the year for a change made in another year', () => {
		expect(shortDate('2025-12-24T08:00:00', now)).toBe('24 gru 2025');
	});
});

describe('archivedSince', () => {
	it('gives the day, the short month and the year', () => {
		expect(archivedSince('2026-11-06T08:00:00')).toBe('w Archiwum od 6 lis 2026');
	});
});
