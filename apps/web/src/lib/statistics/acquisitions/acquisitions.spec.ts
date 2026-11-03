import { describe, expect, it } from 'vitest';
import { columnsOf, shortDate, ticksOf } from './acquisitions.ts';

describe('acquisitions', () => {
	it('labels every fifth day', () => {
		const buckets = Array.from({ length: 11 }, (_, index) => ({
			start: `2026-10-${String(index + 1).padStart(2, '0')}`,
			added: index
		}));

		expect(columnsOf('day', buckets).map((column) => column.label)).toEqual([
			'1.10',
			undefined,
			undefined,
			undefined,
			undefined,
			'6.10',
			undefined,
			undefined,
			undefined,
			undefined,
			'11.10'
		]);
	});

	it('writes a month as the month and the year', () => {
		expect(shortDate('month', '2026-09-01')).toBe('09.2026');
	});

	it('spreads four ticks over the highest column', () => {
		expect(ticksOf(292)).toEqual([0, 73, 146, 219, 292]);
		expect(ticksOf(1)).toEqual([0, 1, 2, 3, 4]);
	});
});
