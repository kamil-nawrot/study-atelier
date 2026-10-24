import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { formatDeletedOn } from './format.ts';

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
