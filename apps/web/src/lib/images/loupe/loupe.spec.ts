import { describe, expect, it } from 'vitest';
import { loupeZoomed } from './loupe.ts';

const wheel = { deltaMode: 0, ctrlKey: false };

describe('loupeZoomed', () => {
	it('keeps the level when the delta is zero', () => {
		expect(loupeZoomed(3, { ...wheel, deltaY: 0 })).toBe(3);
	});

	it('zooms in on a negative delta and out on a positive one', () => {
		expect(loupeZoomed(3, { ...wheel, deltaY: -100 })).toBeGreaterThan(3);
		expect(loupeZoomed(3, { ...wheel, deltaY: 100 })).toBeLessThan(3);
	});

	it('changes the level by the same ratio at every level', () => {
		const low = loupeZoomed(2, { ...wheel, deltaY: -40 }) / 2;
		const high = loupeZoomed(8, { ...wheel, deltaY: -40 }) / 8;

		expect(high).toBeCloseTo(low);
	});

	it('reverses a zoom with the opposite delta', () => {
		const zoomed = loupeZoomed(3, { ...wheel, deltaY: -70 });

		expect(loupeZoomed(zoomed, { ...wheel, deltaY: 70 })).toBeCloseTo(3);
	});

	it('zooms a pinch gesture faster than a wheel for the same delta', () => {
		const pinch = loupeZoomed(2, { deltaMode: 0, ctrlKey: true, deltaY: -5 });
		const plain = loupeZoomed(2, { ...wheel, deltaY: -5 });

		expect(pinch).toBeGreaterThan(plain);
	});

	it('counts lines and pages as larger deltas than pixels', () => {
		const pixels = loupeZoomed(2, { ...wheel, deltaY: -3 });
		const lines = loupeZoomed(2, { deltaMode: 1, ctrlKey: false, deltaY: -3 });
		const pages = loupeZoomed(2, { deltaMode: 2, ctrlKey: false, deltaY: -3 });

		expect(lines).toBeGreaterThan(pixels);
		expect(pages).toBeGreaterThan(lines);
	});
});
