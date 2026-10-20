import type { EraCode } from '#lib/collection/types.ts';
import { ERA_CODES } from '#lib/collection/eras.ts';

export type TimeSpan = {
	start: number;
	end: number;
};

export type View = {
	center: number;
	span: number;
};

export type Era = TimeSpan & {
	code: EraCode;
};

const ERA_STARTS: Record<EraCode, number> = {
	prehistory: -40000,
	antiquity: -3000,
	middle_ages: 476,
	early_modern: 1492,
	modern: 1789,
	contemporary: 1945
};

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

export function eras(currentYear: number = new Date().getFullYear()): Era[] {
	return ERA_CODES.map((code, index) => {
		const next = ERA_CODES[index + 1];
		return {
			code,
			start: timeOf(ERA_STARTS[code]),
			end: next ? timeOf(ERA_STARTS[next]) : timeOf(currentYear) + 1
		};
	});
}

export function eraOf(code: EraCode, currentYear?: number): Era {
	return eras(currentYear).find((era) => era.code === code) as Era;
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
