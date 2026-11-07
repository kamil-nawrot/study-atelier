import { MAX_COLUMNS, type Target } from '#lib/exhibitions/editor/block-rows/block-rows.ts';

export type BlockBox = { id: string; left: number; right: number };

export type RowBox = { id: string; top: number; bottom: number; blocks: BlockBox[] };

export type Frame = { left: number; right: number };

export type Box = { top: number; left: number; width: number; height: number };

export type Mark = Box & { side: boolean; slot: Box };

export type Drop = { target: Target; mark: Mark };

export const SIDE_SHARE = 0.25;

export const SIDE_MAX = 96;

const LINE = 4;

const BAND = 24;

function line(rows: readonly RowBox[], index: number, frame: Frame): Drop {
	const above = rows[index - 1];
	const below = rows[index];
	const y =
		above && below
			? (above.bottom + below.top) / 2
			: below
				? below.top - LINE * 2
				: (above?.bottom ?? 0) + LINE * 2;
	return {
		target: { before: below?.id },
		mark: {
			top: y - LINE / 2,
			left: frame.left,
			width: frame.right - frame.left,
			height: LINE,
			side: false,
			slot: { top: y - BAND / 2, left: frame.left, width: frame.right - frame.left, height: BAND }
		}
	};
}

function side(row: RowBox, at: number, x: number, columns: number): Drop {
	const left = row.blocks[0]?.left ?? x;
	const right = row.blocks.at(-1)?.right ?? x;
	const width = (right - left) / columns;
	const start = at === 0 ? left : at === row.blocks.length ? right - width : x - width / 2;
	return {
		target: { row: row.id, at },
		mark: {
			top: row.top,
			left: x - LINE / 2,
			width: LINE,
			height: row.bottom - row.top,
			side: true,
			slot: { top: row.top, left: start, width, height: row.bottom - row.top }
		}
	};
}

function sideOf(row: RowBox, x: number, moving: string | undefined): Drop | null | undefined {
	const others = row.blocks.filter((block) => block.id !== moving);
	if (others.length >= MAX_COLUMNS || others.length === 0) return undefined;
	const columns = others.length + 1;
	const own = row.blocks.findIndex((block) => block.id === moving);
	const offer = (at: number, edge: number): Drop | null =>
		own >= 0 && (at === own || at === own + 1) ? null : side(row, at, edge, columns);
	const zoneOf = (block: BlockBox): number =>
		Math.min((block.right - block.left) * SIDE_SHARE, SIDE_MAX);
	const first = row.blocks[0];
	const last = row.blocks.at(-1);
	if (first && x >= first.left && x <= first.left + zoneOf(first)) return offer(0, first.left);
	if (last && x <= last.right && x >= last.right - zoneOf(last)) {
		return offer(row.blocks.length, last.right);
	}
	for (const [index, block] of row.blocks.entries()) {
		const next = row.blocks[index + 1];
		if (!next) break;
		if (x >= block.right - zoneOf(block) && x <= next.left + zoneOf(next)) {
			return offer(index + 1, (block.right + next.left) / 2);
		}
	}
	return undefined;
}

function within(row: RowBox, x: number, moving: string | undefined): boolean {
	return row.blocks.some((block) => block.id === moving && x >= block.left && x <= block.right);
}

function lineAt(
	rows: readonly RowBox[],
	index: number,
	frame: Frame,
	moving: string | undefined
): Drop | undefined {
	const alone = (row: RowBox | undefined): boolean =>
		row?.blocks.length === 1 && row.blocks[0]?.id === moving;
	if (moving && (alone(rows[index]) || alone(rows[index - 1]))) return undefined;
	return line(rows, index, frame);
}

export function dropAt(
	rows: readonly RowBox[],
	frame: Frame,
	x: number,
	y: number,
	moving?: string
): Drop | undefined {
	if (x < frame.left || x > frame.right) return undefined;
	if (rows.length === 0) return line(rows, 0, frame);
	for (const [index, row] of rows.entries()) {
		if (y > row.bottom) continue;
		if (y >= row.top) {
			const beside = sideOf(row, x, moving);
			if (beside !== undefined) return beside ?? undefined;
			if (within(row, x, moving)) return undefined;
			return lineAt(rows, y < (row.top + row.bottom) / 2 ? index : index + 1, frame, moving);
		}
		return lineAt(rows, index, frame, moving);
	}
	return lineAt(rows, rows.length, frame, moving);
}
