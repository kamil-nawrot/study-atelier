import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import { ERA_CODES, eraEndYear, eraStartYear } from '#lib/catalogue/eras/eras.ts';
import type { TimeSpan } from '#lib/timeline/types/time-span.ts';
import type { View } from '#lib/timeline/types/view.ts';
import type { Era } from '#lib/timeline/types/era.ts';

type DatedItem = {
	yearFrom: number | null;
	yearTo: number | null;
};

const PREHISTORY_ROUNDING = 1000;

export function timeOf(year: number): number {
	return year < 0 ? year + 1 : year;
}

export function yearAt(time: number): number {
	const year = Math.floor(time);
	return year <= 0 ? year - 1 : year;
}

export function spanOfYears(yearFrom: number | null, yearTo: number): TimeSpan {
	return { start: timeOf(yearFrom ?? yearTo), end: timeOf(yearTo) + 1 };
}

export function distanceToSpan(span: TimeSpan, time: number): number {
	if (time < span.start) return span.start - time;
	if (time >= span.end) return time - span.end;
	return 0;
}

export function entriesSpan(items: readonly DatedItem[]): TimeSpan | undefined {
	let span: TimeSpan | undefined;
	for (const item of items) {
		if (item.yearTo === null) continue;
		const own = spanOfYears(item.yearFrom, item.yearTo);
		span = span
			? { start: Math.min(span.start, own.start), end: Math.max(span.end, own.end) }
			: own;
	}
	return span;
}

function prehistoryStart(entries: TimeSpan | undefined): number {
	const fixed = timeOf(eraStartYear('prehistory'));
	if (!entries || entries.start >= fixed) return fixed;
	return Math.floor(entries.start / PREHISTORY_ROUNDING) * PREHISTORY_ROUNDING;
}

export function eras(currentYear: number = new Date().getFullYear(), entries?: TimeSpan): Era[] {
	const now = timeOf(currentYear) + 1;
	return ERA_CODES.map((code, index) => {
		const next = ERA_CODES[index + 1];
		return {
			code,
			start: index === 0 ? prehistoryStart(entries) : timeOf(eraStartYear(code)),
			end: next
				? timeOf(eraEndYear(code) ?? eraStartYear(next))
				: Math.max(now, entries?.end ?? now)
		};
	});
}

export function eraOf(code: EraCode, currentYear?: number, entries?: TimeSpan): Era {
	return eras(currentYear, entries).find((era) => era.code === code) as Era;
}

export function overlaps(span: TimeSpan, other: TimeSpan): boolean {
	return span.end > other.start && span.start < other.end;
}

export function viewStart(view: View): number {
	return view.center - view.span / 2;
}

export function positionOf(view: View, length: number, time: number): number {
	return ((time - viewStart(view)) / view.span) * length;
}
