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
