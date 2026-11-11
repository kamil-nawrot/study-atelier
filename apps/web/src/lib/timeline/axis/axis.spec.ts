import { describe, expect, it } from 'vitest';
import {
	axisKind,
	labelGroups,
	labelStride,
	lineTimes,
	lineUnit,
	segments,
	tickYears
} from './axis.ts';

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

describe('labelStride', () => {
	it('labels every segment while its label fits and every second, fifth or tenth when it does not', () => {
		expect(labelStride(120, 100)).toBe(1);
		expect(labelStride(60, 100)).toBe(2);
		expect(labelStride(30, 100)).toBe(5);
		expect(labelStride(12, 100)).toBe(10);
		expect(labelStride(0.5, 100)).toBe(100);
	});
});

describe('labelGroups', () => {
	const open = { start: -50000, end: 2100 };

	function numbers(groups: ReturnType<typeof labelGroups>): [number, boolean][] {
		return groups.map((group) => [group.number, group.beforeCommonEra]);
	}

	it('labels every segment of the view and the era at a stride of 1', () => {
		expect(numbers(labelGroups({ center: 1600, span: 200 }, open, 100, 1))).toEqual([
			[15, false],
			[16, false],
			[17, false]
		]);
	});

	it('keeps the label of a group whose first segment is out of view or out of the era', () => {
		const groups = labelGroups({ center: 1650, span: 300 }, { start: 1492, end: 1789 }, 100, 2);
		expect(numbers(groups)).toEqual([
			[15, false],
			[17, false]
		]);
		expect(groups[0]).toMatchObject({ start: 1401, end: 1601 });
	});

	it('drops a group that ends before the era or the view begins', () => {
		expect(
			numbers(labelGroups({ center: 1650, span: 300 }, { start: 1601, end: 1789 }, 100, 2))
		).toEqual([[17, false]]);
	});

	it('groups segments from the year 0 on both sides, so the 1st century and millennium get a label', () => {
		expect(numbers(labelGroups({ center: 0, span: 1000 }, open, 100, 2))).toEqual([
			[6, true],
			[4, true],
			[2, true],
			[1, false],
			[3, false],
			[5, false]
		]);
		const millennia = labelGroups({ center: 0, span: 6000 }, open, 1000, 2);
		expect(millennia.find((group) => !group.beforeCommonEra)).toMatchObject({
			number: 1,
			start: 1,
			end: 2001
		});
		expect(millennia.find((group) => group.number === 2)).toMatchObject({
			beforeCommonEra: true,
			start: -1999,
			end: 1
		});
	});

	it('labels the 1st millennium in a group of five', () => {
		const groups = labelGroups({ center: -500, span: 9000 }, open, 1000, 5);
		expect(numbers(groups)).toEqual([
			[10, true],
			[5, true],
			[1, false]
		]);
	});
});
