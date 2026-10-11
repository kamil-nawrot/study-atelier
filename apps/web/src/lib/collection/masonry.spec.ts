import { describe, expect, it } from 'vitest';
import { columnCount, distribute, MAX_WIDE_COLUMNS, MIN_WIDE_COLUMNS } from './masonry.ts';

describe('columnCount', () => {
	it('uses one column on a narrow screen', () => {
		expect(columnCount(false, 1600)).toBe(1);
	});

	it('uses at least the minimum number of columns on a wide screen', () => {
		expect(columnCount(true, 768)).toBe(MIN_WIDE_COLUMNS);
	});

	it('never uses more than the maximum number of columns', () => {
		expect(columnCount(true, 4000)).toBe(MAX_WIDE_COLUMNS);
	});
});

describe('distribute', () => {
	it('keeps the order in a single column', () => {
		expect(distribute(['a', 'b', 'c'], 1, () => 1)).toEqual([['a', 'b', 'c']]);
	});

	it('puts each item into the shortest column', () => {
		const ratios: Record<string, number> = { tall: 1, short: 0.5, next: 0.5, last: 1 };

		const columns = distribute(['tall', 'short', 'next', 'last'], 2, (item) => ratios[item]);

		expect(columns).toEqual([
			['tall', 'last'],
			['short', 'next']
		]);
	});
});
