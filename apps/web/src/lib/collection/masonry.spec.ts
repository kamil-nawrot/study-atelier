import { describe, expect, it } from 'vitest';
import {
	columnCount,
	distribute,
	MAX_WIDE_COLUMNS,
	MIN_WIDE_COLUMNS,
	tileSizes,
	WIDE_MIN_WIDTH
} from './masonry.ts';

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

describe('tileSizes', () => {
	function tileShare(sizes: string, viewport: number): number {
		const options = sizes.split(', ').map((option) => {
			const match = /^(?:\(min-width: (\d+)px\) )?(\d+)vw$/.exec(option);
			if (!match) throw new Error(`Unexpected size ${option}`);
			return { min: Number(match[1] ?? 0), share: Number(match[2]) };
		});
		return options.find((option) => viewport >= option.min)?.share ?? 0;
	}

	it.each([360, WIDE_MIN_WIDTH - 1, WIDE_MIN_WIDTH, 1000, 1279, 1280, 1600, 2400])(
		'matches the width of a column at %ipx',
		(viewport) => {
			const wide = viewport >= WIDE_MIN_WIDTH;
			const columns = columnCount(wide, viewport);

			expect(tileShare(tileSizes(), viewport)).toBe(Math.round(100 / columns));
		}
	);
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
