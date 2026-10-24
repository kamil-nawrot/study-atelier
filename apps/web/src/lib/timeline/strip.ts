import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { Era } from './time.ts';

export type StripSegment = {
	code: EraCode;
	from: number;
	to: number;
	shortened: boolean;
};

export function stripLayout(eras: readonly Era[], width: number, minWidth: number): StripSegment[] {
	const lengths = eras.map((era) => era.end - era.start);
	const weights = lengths.map((length, index) => (index === 0 ? lengths[1] : length));
	const floored = new Set<number>();
	let widths = weights.map(() => minWidth);
	for (;;) {
		const free = weights.reduce((sum, weight, index) => sum + (floored.has(index) ? 0 : weight), 0);
		const room = width - floored.size * minWidth;
		widths = weights.map((weight, index) =>
			floored.has(index) ? minWidth : free > 0 ? (weight * room) / free : minWidth
		);
		const below = widths.findIndex((value, index) => !floored.has(index) && value < minWidth);
		if (below < 0) break;
		floored.add(below);
	}
	let from = 0;
	return eras.map((era, index) => {
		const segment = { code: era.code, from, to: from + widths[index], shortened: index === 0 };
		from += widths[index];
		return segment;
	});
}

export function stripPosition(
	segments: readonly StripSegment[],
	eras: readonly Era[],
	time: number
): number {
	const found = eras.findIndex((era) => time < era.end);
	const index = found === -1 ? eras.length - 1 : found;
	const era = eras[index];
	const segment = segments[index];
	const share = Math.min(Math.max((time - era.start) / (era.end - era.start), 0), 1);
	return segment.from + share * (segment.to - segment.from);
}
