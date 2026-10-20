import { describe, expect, it } from 'vitest';
import { STRIP_MIN_WIDTH, stripLayout, stripPosition } from './strip.ts';
import { eras } from './time.ts';

const all = eras(2026);

describe('stripLayout', () => {
	it('keeps the true proportions from the shortest era and shortens prehistory', () => {
		const segments = stripLayout(all, 1240);
		const widths = segments.map((segment) => segment.to - segment.from);
		expect(widths[5]).toBeCloseTo(STRIP_MIN_WIDTH);
		expect(widths[3] / widths[4]).toBeCloseTo((1789 - 1492) / (1945 - 1789));
		expect(segments[0].shortened).toBe(true);
		expect(segments.at(-1)?.to).toBeCloseTo(1240);
	});

	it('gives every era at least the minimum width when they do not fit', () => {
		const segments = stripLayout(all, 358);
		const widths = segments.map((segment) => segment.to - segment.from);
		expect(Math.min(...widths)).toBeGreaterThanOrEqual(STRIP_MIN_WIDTH - 0.001);
		expect(widths[0]).toBeGreaterThanOrEqual(44);
		expect(segments.at(-1)?.to).toBeCloseTo(358);
	});
});

describe('stripPosition', () => {
	it('maps a time into its era segment', () => {
		const segments = stripLayout(all, 1240);
		expect(stripPosition(segments, all, 1492)).toBeCloseTo(segments[3].from);
		expect(stripPosition(segments, all, 5000)).toBeCloseTo(1240);
	});
});
