import type { EraCode } from '#lib/collection/types.ts';
import type { Era } from './time.ts';

export type StripSegment = {
	code: EraCode;
	from: number;
	to: number;
	shortened: boolean;
};

export const STRIP_MIN_WIDTH = 16;

const SHORTENED_MIN_WIDTH = 44;
const SHORTENED_SHARE = 0.1;

export function stripLayout(eras: readonly Era[], width: number): StripSegment[] {
	const [first, ...rest] = eras;
	const years = rest.map((era) => era.end - era.start);
	const room = width - Math.max(SHORTENED_MIN_WIDTH, Math.round(width * SHORTENED_SHARE));
	let widths = years.map((length) => (length * STRIP_MIN_WIDTH) / Math.min(...years));
	if (widths.reduce((sum, value) => sum + value, 0) > room) {
		const floored = new Set<number>();
		for (;;) {
			const free = years.reduce((sum, length, index) => sum + (floored.has(index) ? 0 : length), 0);
			const scale = (room - floored.size * STRIP_MIN_WIDTH) / free;
			widths = years.map((length, index) =>
				floored.has(index) ? STRIP_MIN_WIDTH : length * scale
			);
			const below = widths.findIndex(
				(value, index) => !floored.has(index) && value < STRIP_MIN_WIDTH
			);
			if (below < 0) break;
			floored.add(below);
		}
	}
	const shortened = width - widths.reduce((sum, value) => sum + value, 0);
	const segments: StripSegment[] = [{ code: first.code, from: 0, to: shortened, shortened: true }];
	let from = shortened;
	rest.forEach((era, index) => {
		segments.push({ code: era.code, from, to: from + widths[index], shortened: false });
		from += widths[index];
	});
	return segments;
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
