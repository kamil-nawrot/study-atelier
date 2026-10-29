import { describe, expect, it } from 'vitest';
import {
	distanceToSpan,
	entriesSpan,
	eraOf,
	eras,
	overlaps,
	positionOf,
	spanOfYears,
	timeOf,
	yearAt
} from './time.ts';

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

describe('entriesSpan and the bounds of the first and the last era', () => {
	it('spans the dated items from the earliest start to the latest end', () => {
		expect(
			entriesSpan([
				{ yearFrom: -500, yearTo: -400 },
				{ yearFrom: null, yearTo: -43500 },
				{ yearFrom: 2030, yearTo: 2040 },
				{ yearFrom: null, yearTo: null }
			])
		).toEqual({ start: timeOf(-43500), end: 2041 });
		expect(entriesSpan([])).toBeUndefined();
	});

	it('starts prehistory at the oldest entry, a full millennium earlier, but never later than 40000 BCE', () => {
		const span = (start: number): { start: number; end: number } => ({ start, end: 2000 });
		expect(eras(2026, span(timeOf(-43500)))[0].start).toBe(-44000);
		expect(eras(2026, span(timeOf(-200000)))[0].start).toBe(-200000);
		expect(eras(2026, span(timeOf(-500)))[0].start).toBe(timeOf(-40000));
		expect(eraOf('antiquity', 2026, span(timeOf(-43500))).start).toBe(timeOf(-3000));
	});

	it('ends the contemporary era at the latest entry when it lies in the future', () => {
		expect(eraOf('contemporary', 2026, { start: 1500, end: 2041 }).end).toBe(2041);
		expect(eraOf('contemporary', 2026, { start: 1500, end: 1900 }).end).toBe(2027);
	});
});

describe('distanceToSpan', () => {
	it('is zero inside the span and the gap to the nearer end outside it', () => {
		const span = spanOfYears(1600, 1700);
		expect(distanceToSpan(span, 1645)).toBe(0);
		expect(distanceToSpan(span, 1590)).toBe(10);
		expect(distanceToSpan(span, 1711)).toBe(10);
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
