import { UNKNOWN_AUTHOR } from '#lib/wall/filter/filter.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { Dimension } from '#lib/statistics/dimensions/dimensions.ts';

export const BAR_ROWS = 12;
export const TABLE_COLUMNS = 6;

export type Counted = { value: string; count: number };

export type Bars = {
	rows: Counted[];
	rest: { values: number; count: number } | null;
	unknown: number;
	none: number;
};

export type CrossTable = {
	rows: Counted[];
	columns: Counted[];
	cells: Map<string, number>;
	allRows: number;
	allColumns: number;
	total: number;
};

function tally(
	artworks: readonly WallArtwork[],
	dimension: Dimension
): { counted: Counted[]; none: number } {
	const counts = new Map<string, number>();
	let none = 0;
	for (const artwork of artworks) {
		const values = dimension.valuesOf(artwork);
		if (values.length === 0) none += 1;
		for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	const counted = [...counts]
		.map(([value, count]) => ({ value, count }))
		.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'pl'));
	return { counted, none };
}

export function countValues(artworks: readonly WallArtwork[], dimension: Dimension): Counted[] {
	return tally(artworks, dimension).counted;
}

function inOrder(counted: Counted[], dimension: Dimension): Counted[] {
	const order = dimension.order;
	if (!order) return counted;
	return [...counted].sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
}

export function barsOf(artworks: readonly WallArtwork[], dimension: Dimension): Bars {
	const { counted: all, none } = tally(artworks, dimension);
	const counted = all.filter((row) => row.value !== UNKNOWN_AUTHOR);
	const rest = counted.slice(BAR_ROWS);
	return {
		rows: inOrder(counted.slice(0, BAR_ROWS), dimension),
		unknown: all.find((row) => row.value === UNKNOWN_AUTHOR)?.count ?? 0,
		rest:
			rest.length > 0
				? { values: rest.length, count: rest.reduce((sum, row) => sum + row.count, 0) }
				: null,
		none
	};
}

export function cellKey(row: string, column: string): string {
	return `${row}\u0000${column}`;
}

export function crossTableOf(
	artworks: readonly WallArtwork[],
	rowDimension: Dimension,
	columnDimension: Dimension
): CrossTable {
	const rows = countValues(artworks, rowDimension);
	const columns = countValues(artworks, columnDimension);
	const cells = new Map<string, number>();
	for (const artwork of artworks) {
		for (const row of rowDimension.valuesOf(artwork)) {
			for (const column of columnDimension.valuesOf(artwork)) {
				const key = cellKey(row, column);
				cells.set(key, (cells.get(key) ?? 0) + 1);
			}
		}
	}
	return {
		rows: inOrder(rows.slice(0, BAR_ROWS), rowDimension),
		columns: inOrder(columns.slice(0, TABLE_COLUMNS), columnDimension),
		cells,
		allRows: rows.length,
		allColumns: columns.length,
		total: artworks.length
	};
}
