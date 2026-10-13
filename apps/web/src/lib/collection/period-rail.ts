import type { CurrentPeriod } from './types.ts';

export type RailState = 'past' | 'current' | 'upcoming';

export type RailEntry = {
	state: RailState;
	offset: number;
};

export const MAX_RAIL_ROW = 28;

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, value));
}

export function referenceLine(
	scroll: number,
	viewportHeight: number,
	documentHeight: number,
	topInset: number
): number {
	const scrollable = documentHeight - viewportHeight;
	const fraction = scrollable > 0 ? clamp(scroll / scrollable, 0, 1) : 0;
	return scroll + topInset + fraction * (viewportHeight - topInset);
}

export function monotone(starts: number[]): number[] {
	let previous = -Infinity;
	return starts.map((start) => (previous = Math.max(previous, start)));
}

export function currentPeriod(starts: number[], end: number, reference: number): CurrentPeriod {
	if (starts.length === 0) return { index: 0, progress: 0 };
	let index = 0;
	starts.forEach((start, position) => {
		if (start <= reference) index = position;
	});
	const next = index + 1 < starts.length ? starts[index + 1] : end;
	const span = next - starts[index];
	const progress = span > 0 ? clamp((reference - starts[index]) / span, 0, 1) : 1;
	return { index, progress: reference < starts[index] ? 0 : progress };
}

export function railRow(count: number, height: number, maxRow = MAX_RAIL_ROW): number {
	return Math.min(maxRow, height / Math.max(count, 1));
}

export function railLayout(
	count: number,
	current: CurrentPeriod,
	height: number,
	maxRow = MAX_RAIL_ROW
): RailEntry[] {
	const row = railRow(count, height, maxRow);
	const topSlot = (index: number): number => index * row;
	const bottomSlot = (index: number): number => height - (count - index) * row;

	return Array.from({ length: count }, (_, index): RailEntry => {
		if (index < current.index) return { state: 'past', offset: topSlot(index) };
		if (index > current.index) return { state: 'upcoming', offset: bottomSlot(index) };
		const from = index === 0 ? topSlot(0) : bottomSlot(index);
		return { state: 'current', offset: from + (topSlot(index) - from) * current.progress };
	});
}
