import { describe, expect, it } from 'vitest';
import { axisKind, lineTimes, lineUnit, segments, tickYears } from './axis.ts';

describe('segments', () => {
	it('splits the view into centuries that start in year 1', () => {
		expect(segments({ center: 1600, span: 200 }, 100).map((segment) => segment.number)).toEqual([
			15, 16, 17
		]);
		expect(segments({ center: 1600, span: 200 }, 100)[1]).toEqual({
			number: 16,
			beforeCommonEra: false,
			start: 1501,
			end: 1601
		});
	});

	it('counts centuries before the common era back from year 1 BCE', () => {
		const around = segments({ center: 1, span: 150 }, 100);
		expect(around.map((segment) => [segment.number, segment.beforeCommonEra])).toEqual([
			[1, true],
			[1, false]
		]);
		expect(around[0]).toMatchObject({ start: -99, end: 1 });
	});
});

describe('axisKind and tickYears', () => {
	it('picks units a learner reads at each width of the view', () => {
		expect(axisKind({ center: -20000, span: 38000 })).toBe('years');
		expect(axisKind({ center: -1000, span: 3600 })).toBe('millennia');
		expect(axisKind({ center: 1640, span: 309 })).toBe('centuries');
		expect(axisKind({ center: 1640, span: 100 })).toBe('decades');
	});

	it('marks decades close up and skips the year 0', () => {
		expect(tickYears({ center: 1640, span: 100 })).toContain(1640);
		expect(tickYears({ center: 1640, span: 100 }).every((year) => year % 10 === 0)).toBe(true);
		expect(tickYears({ center: 1640, span: 30 }).some((year) => year % 10 === 5)).toBe(true);
		expect(tickYears({ center: 0, span: 40000 })).not.toContain(0);
		expect(tickYears({ center: 1640, span: 309 })).toEqual([]);
	});
});

describe('lineTimes', () => {
	it('draws a line at the start of every century, or millennium when centuries are too close', () => {
		expect(lineUnit({ center: 1640, span: 309 }, 1000)).toBe(100);
		expect(lineUnit({ center: -20000, span: 38000 }, 1000)).toBe(1000);
		expect(lineTimes({ center: 1640, span: 309 }, 1000, { start: 1492, end: 1789 })).toEqual([
			1501, 1601, 1701
		]);
	});
});
