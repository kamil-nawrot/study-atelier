export const NO_IMAGE_RATIO = 5 / 4;
export const CAPTION_RATIO = 0.35;
export const WIDE_MIN_WIDTH = 768;
export const MIN_WIDE_COLUMN_WIDTH = 320;
export const MIN_WIDE_COLUMNS = 3;
export const MAX_WIDE_COLUMNS = 4;

export function columnCount(wide: boolean, viewportWidth: number): number {
	if (!wide) return 1;
	const fitting = Math.floor(viewportWidth / MIN_WIDE_COLUMN_WIDTH);
	return Math.min(MAX_WIDE_COLUMNS, Math.max(MIN_WIDE_COLUMNS, fitting));
}

function columnShare(columns: number): string {
	return `${Math.round(100 / columns)}vw`;
}

export function tileSizes(): string {
	const widest = MIN_WIDE_COLUMN_WIDTH * MAX_WIDE_COLUMNS;
	return [
		`(min-width: ${widest}px) ${columnShare(MAX_WIDE_COLUMNS)}`,
		`(min-width: ${WIDE_MIN_WIDTH}px) ${columnShare(MIN_WIDE_COLUMNS)}`,
		'100vw'
	].join(', ');
}

export function distribute<T>(items: T[], columns: number, ratio: (item: T) => number): T[][] {
	const heights = Array.from({ length: columns }, () => 0);
	const result = Array.from({ length: columns }, (): T[] => []);
	for (const item of items) {
		const shortest = heights.indexOf(Math.min(...heights));
		result[shortest].push(item);
		heights[shortest] += ratio(item) + CAPTION_RATIO;
	}
	return result;
}
