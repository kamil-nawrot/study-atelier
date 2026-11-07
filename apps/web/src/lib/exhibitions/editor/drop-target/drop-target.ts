import { MAX_COLUMNS, type Target } from '#lib/exhibitions/editor/block-rows/block-rows.ts';

export type BlockBox = { id: string; left: number; right: number };

export type RowBox = { id: string; top: number; bottom: number; blocks: BlockBox[] };

export type Frame = { left: number; right: number };

export type Mark = { top: number; left: number; width: number; height: number; side: boolean };

export type Drop = { target: Target; mark: Mark };

export const SIDE_SHARE = 0.25;

export const SIDE_MAX = 96;

const LINE = 4;

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
			side: false
		}
	};
}

function side(row: RowBox, at: number, x: number): Drop {
	return {
		target: { row: row.id, at },
		mark: {
			top: row.top,
			left: x - LINE / 2,
			width: LINE,
			height: row.bottom - row.top,
			side: true
		}
	};
}

function sideOf(row: RowBox, x: number, moving: string | undefined): Drop | undefined {
	const others = row.blocks.filter((block) => block.id !== moving);
	if (others.length >= MAX_COLUMNS || others.length === 0) return undefined;
	for (const [index, block] of row.blocks.entries()) {
		if (x < block.left || x > block.right) continue;
		const zone = Math.min((block.right - block.left) * SIDE_SHARE, SIDE_MAX);
		if (x <= block.left + zone) return side(row, index, block.left);
		if (x >= block.right - zone) return side(row, index + 1, block.right);
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
