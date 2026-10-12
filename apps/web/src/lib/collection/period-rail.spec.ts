import { describe, expect, it } from 'vitest';
import { currentPeriod, monotone, railLayout, referenceLine } from './period-rail.ts';

describe('referenceLine', () => {
	it('starts at the top inset and ends at the bottom edge of the screen', () => {
		expect(referenceLine(0, 800, 3000, 80)).toBe(80);
		expect(referenceLine(2200, 800, 3000, 80)).toBe(3000);
	});

	it('moves through the middle of the screen halfway down the page', () => {
		expect(referenceLine(1100, 800, 3000, 0)).toBe(1500);
	});

	it('stays at the top inset when the page does not scroll', () => {
		expect(referenceLine(0, 800, 800, 80)).toBe(80);
	});
});

describe('monotone', () => {
	it('never lets a period start before the one ahead of it', () => {
		expect(monotone([100, 300, 250, 500])).toEqual([100, 300, 300, 500]);
	});
});

describe('currentPeriod', () => {
	const starts = [100, 600, 1200];

	it('picks the last period that has started', () => {
		expect(currentPeriod(starts, 2000, 700).index).toBe(1);
		expect(currentPeriod(starts, 2000, 1200).index).toBe(2);
	});

	it('keeps the first period before the wall reaches the reference line', () => {
		expect(currentPeriod(starts, 2000, 0)).toEqual({ index: 0, progress: 0 });
	});

	it('measures progress through the period', () => {
		expect(currentPeriod(starts, 2000, 350).progress).toBeCloseTo(0.5);
		expect(currentPeriod(starts, 2000, 1600).progress).toBeCloseTo(0.5);
	});

	it('has no current period without periods', () => {
		expect(currentPeriod([], 0, 500)).toEqual({ index: 0, progress: 0 });
	});

	it('finishes the last period past the end of the wall', () => {
		expect(currentPeriod(starts, 2000, 2400)).toEqual({ index: 2, progress: 1 });
	});
});

describe('railLayout', () => {
	it('stacks past periods at the top and upcoming ones at the bottom', () => {
		const layout = railLayout(4, { index: 1, progress: 0 }, 400, 20);

		expect(layout.map((entry) => entry.state)).toEqual(['past', 'current', 'upcoming', 'upcoming']);
		expect(layout[0].offset).toBe(0);
		expect(layout[2].offset).toBe(360);
		expect(layout[3].offset).toBe(380);
	});

	it('starts the current period where the first upcoming one would be', () => {
		const layout = railLayout(4, { index: 1, progress: 0 }, 400, 20);

		expect(layout[1].offset).toBe(340);
	});

	it('moves the current period to the end of the top stack as it passes', () => {
		const middle = railLayout(4, { index: 1, progress: 0.5 }, 400, 20);
		const done = railLayout(4, { index: 1, progress: 1 }, 400, 20);

		expect(middle[1].offset).toBe(180);
		expect(done[1].offset).toBe(20);
	});

	it('puts the first period at the top edge from the start', () => {
		const layout = railLayout(3, { index: 0, progress: 0 }, 300, 20);

		expect(layout[0]).toEqual({ state: 'current', offset: 0 });
		expect(layout[1].offset).toBe(260);
	});

	it('shrinks the rows when the periods do not fit', () => {
		const layout = railLayout(10, { index: 0, progress: 0 }, 100, 28);

		expect(layout[9].offset).toBe(90);
		expect(layout[1].offset).toBe(10);
	});
});
