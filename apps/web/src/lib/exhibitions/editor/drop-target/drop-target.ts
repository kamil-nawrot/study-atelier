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

function sideOf(row: RowBox, x: number, moving: string | undefined): Drop | undefined {
	const others = row.blocks.filter((block) => block.id !== moving);
	if (others.length >= MAX_COLUMNS || others.length === 0) return undefined;
	for (const [index, block] of row.blocks.entries()) {
		if (x < block.left || x > block.right) continue;
		const zone = Math.min((block.right - block.left) * SIDE_SHARE, SIDE_MAX);
		if (x <= block.left + zone) return side(row, index, block.left, others.length + 1);
		if (x >= block.right - zone) return side(row, index + 1, block.right, others.length + 1);
	}
	return undefined;
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
			if (beside) return beside;
			return line(rows, y < (row.top + row.bottom) / 2 ? index : index + 1, frame);
		}
		return line(rows, index, frame);
	}
	return line(rows, rows.length, frame);
}
