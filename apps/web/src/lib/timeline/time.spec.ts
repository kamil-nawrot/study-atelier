import { describe, expect, it } from 'vitest';
import { eraOf, eras, overlaps, positionOf, spanOfYears, timeOf, yearAt } from './time.ts';

describe('timeOf and yearAt', () => {
	it('maps years without a year 0 onto a continuous time and back', () => {
		expect(timeOf(1)).toBe(1);
		expect(timeOf(-1)).toBe(0);
		expect(timeOf(-500)).toBe(-499);
		expect(yearAt(0.5)).toBe(-1);
		expect(yearAt(1.5)).toBe(1);
		expect(yearAt(timeOf(-500))).toBe(-500);
	});

	it('gives a span its whole end year', () => {
		expect(spanOfYears(null, 1648)).toEqual({ start: 1648, end: 1649 });
		expect(spanOfYears(-27, 180)).toEqual({ start: -26, end: 181 });
	});
});

describe('eras', () => {
	it('covers the six eras end to end up to the current year', () => {
		const all = eras(2026);
		expect(all.map((era) => era.code)).toEqual([
			'prehistory',
			'antiquity',
			'middle_ages',
			'early_modern',
			'modern',
			'contemporary'
		]);
		expect(all[0].start).toBe(timeOf(-40000));
		expect(all[1].start).toBe(all[0].end);
		expect(eraOf('early_modern', 2026)).toEqual({ code: 'early_modern', start: 1492, end: 1789 });
		expect(eraOf('contemporary', 2026).end).toBe(2027);
	});

	it('tells whether two spans share any time', () => {
		expect(overlaps({ start: 1490, end: 1511 }, eraOf('early_modern'))).toBe(true);
		expect(overlaps({ start: 1789, end: 1790 }, eraOf('early_modern'))).toBe(false);
	});
});

describe('positionOf', () => {
	it('places a time along the length of the view', () => {
		expect(positionOf({ center: 1600, span: 100 }, 1000, 1550)).toBe(0);
		expect(positionOf({ center: 1600, span: 100 }, 1000, 1600)).toBe(500);
	});
});
