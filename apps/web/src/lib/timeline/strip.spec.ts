import { describe, expect, it } from 'vitest';
import { stripLayout, stripPosition } from './strip.ts';
import { eras, timeOf } from './time.ts';

const all = eras(2026);
const width = (segment: { from: number; to: number }): number => segment.to - segment.from;

describe('stripLayout', () => {
	it('gives prehistory the width of antiquity and keeps the true proportions of the rest', () => {
		const segments = stripLayout(all, 1240, 40);
		expect(width(segments[0])).toBeCloseTo(width(segments[1]));
		expect(width(segments[1]) / width(segments[2])).toBeCloseTo((476 + 2999) / (1492 - 476));
		expect(segments[0].shortened).toBe(true);
		expect(segments.at(-1)?.to).toBeCloseTo(1240);
	});

	it('keeps the strip the same however early prehistory starts', () => {
		const longer = eras(2026, { start: timeOf(-200000), end: 2000 });
		expect(stripLayout(longer, 1240, 40)).toEqual(stripLayout(all, 1240, 40));
	});

	it('makes no era narrower than the strip is high', () => {
		for (const total of [1240, 358]) {
			const segments = stripLayout(all, total, 40);
			expect(Math.min(...segments.map(width))).toBeGreaterThanOrEqual(40 - 0.001);
			expect(segments.at(-1)?.to).toBeCloseTo(total);
			expect(width(segments[0])).toBeGreaterThanOrEqual(width(segments[1]) - 0.001);
		}
	});
});

describe('stripPosition', () => {
	it('maps a time into its era segment', () => {
		const segments = stripLayout(all, 1240, 40);
		expect(stripPosition(segments, all, 1492)).toBeCloseTo(segments[3].from);
		expect(stripPosition(segments, all, 5000)).toBeCloseTo(1240);
	});
});
