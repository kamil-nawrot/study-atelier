import { describe, expect, it } from 'vitest';
import { barTrack } from '#lib/exhibitions/block-bar-position/block-bar-position.ts';

const bar = { width: 300, height: 40 };

describe('barTrack', () => {
	it('starts above the block, aligned to its left edge, and runs down to its bottom', () => {
		const block = { top: 300, bottom: 400, left: 150, right: 800 };
		expect(barTrack(block, bar, 800)).toEqual({ top: 252, left: 150, height: 148 });
	});

	it('shifts the bar left so it stays inside the document', () => {
		const block = { top: 300, bottom: 400, left: 700, right: 800 };
		expect(barTrack(block, bar, 800).left).toBe(500);
	});

	it('keeps the bar at the left edge when the document is narrower than the bar', () => {
		const block = { top: 300, bottom: 400, left: 20, right: 200 };
		expect(barTrack(block, bar, 200).left).toBe(0);
	});
});
