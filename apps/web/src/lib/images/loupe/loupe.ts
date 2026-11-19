export const LOUPE_SIZE = 220;
export const LOUPE_MIN_RATIO = 1.5;
export const LOUPE_MIN_LEVEL = 1.5;
export const LOUPE_START_LEVEL = 2;

export function loupeViewWidth(shownWidth: number, level: number): number {
	return Math.min(1, LOUPE_SIZE / (shownWidth * level));
}

export function loupeLevel(viewWidth: number, shownWidth: number): number {
	return LOUPE_SIZE / (viewWidth * shownWidth);
}

const WHEEL_RATE = 0.002;
const PINCH_RATE = 0.01;
const LINE_HEIGHT = 16;
const PAGE_HEIGHT = 400;

export function loupeZoomed(
	level: number,
	delta: { deltaY: number; deltaMode: number; ctrlKey: boolean }
): number {
	const pixels =
		delta.deltaMode === 1
			? delta.deltaY * LINE_HEIGHT
			: delta.deltaMode === 2
				? delta.deltaY * PAGE_HEIGHT
				: delta.deltaY;
	return level * Math.exp(-pixels * (delta.ctrlKey ? PINCH_RATE : WHEEL_RATE));
}
