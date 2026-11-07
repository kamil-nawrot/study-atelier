import { describe, expect, it } from 'vitest';
import { barPosition } from '#lib/exhibitions/block-bar-position/block-bar-position.ts';

const column = { top: 0, bottom: 2000, left: 100, right: 900 };
const bar = { width: 300, height: 40 };

describe('barPosition', () => {
	it('puts the bar above the block, aligned to its left edge', () => {
		const block = { top: 300, bottom: 400, left: 150, right: 800 };
		expect(barPosition(block, bar, column, 80)).toEqual({ top: 250, left: 150 });
	});

	it('puts the bar below the block when there is no room above', () => {
		const block = { top: 100, bottom: 200, left: 150, right: 800 };
		expect(barPosition(block, bar, column, 80)).toEqual({ top: 210, left: 150 });
	});

	it('shifts the bar left so it stays inside the document column', () => {
		const block = { top: 300, bottom: 400, left: 800, right: 900 };
		expect(barPosition(block, bar, column, 80).left).toBe(600);
	});

	it('keeps the bar inside the column when the block starts left of it', () => {
		const block = { top: 300, bottom: 400, left: 20, right: 300 };
		expect(barPosition(block, bar, column, 80).left).toBe(100);
	});
});
