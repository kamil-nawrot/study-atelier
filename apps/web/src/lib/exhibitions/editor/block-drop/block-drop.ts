import type { EditorView } from '@tiptap/pm/view';
import {
	MAX_COLUMNS,
	isEmptyBlock,
	type Side
} from '#lib/exhibitions/editor/block-commands/block-commands.ts';

export type DropTarget = {
	from: number;
	to: number;
	top: number;
	left: number;
	width: number;
	height: number;
	replaces: boolean;
	beside?: number;
	side?: Side;
	full?: boolean;
};

type Rect = { top: number; bottom: number; left: number; right: number };

type Cell = { pos: number; rect: Rect };

type Item = {
	offset: number;
	size: number;
	empty: boolean;
	rect: DOMRect;
	cells: Cell[];
};

const SIDE_SHARE = 0.25;

function cellsOf(view: EditorView, offset: number): Cell[] {
	const node = view.state.doc.nodeAt(offset);
	if (node?.type.name !== 'columns') return [];
	const cells: Cell[] = [];
	node.forEach((column, columnOffset) => {
		const pos = offset + 1 + columnOffset + 1;
		const dom = view.nodeDOM(pos);
		if (dom instanceof HTMLElement && column.childCount > 0) {
			cells.push({ pos, rect: dom.getBoundingClientRect() });
		}
	});
	return cells;
}

function placedItems(view: EditorView): Item[] {
	const placed: Item[] = [];
	view.state.doc.forEach((node, offset) => {
		const dom = view.nodeDOM(offset);
		if (dom instanceof HTMLElement) {
			placed.push({
				offset,
				size: node.nodeSize,
				empty: isEmptyBlock(node),
				rect: dom.getBoundingClientRect(),
				cells: cellsOf(view, offset)
			});
		}
	});
	return placed;
}

function nearest(items: Item[], y: number): Item | undefined {
	let best: Item | undefined;
	let distance = Infinity;
	for (const item of items) {
		const { rect } = item;
		const gap = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
		if (gap < distance) {
			best = item;
			distance = gap;
		}
	}
	return best;
}

function cellAt(item: Item, x: number): Cell | undefined {
	if (item.cells.length > 0) {
		return (
			item.cells.find((cell) => x >= cell.rect.left && x <= cell.rect.right) ??
			item.cells.reduce((best, cell) =>
				Math.abs(cell.rect.left + cell.rect.right - 2 * x) <
				Math.abs(best.rect.left + best.rect.right - 2 * x)
					? cell
					: best
			)
		);
	}
	return item.empty ? undefined : { pos: item.offset, rect: item.rect };
}

function sideOf(cell: Cell, x: number): Side | undefined {
	const width = cell.rect.right - cell.rect.left;
	if (x < cell.rect.left + width * SIDE_SHARE) return 'left';
	if (x > cell.rect.right - width * SIDE_SHARE) return 'right';
	return undefined;
}

function besideTarget(item: Item, cell: Cell, side: Side): DropTarget {
	const width = (cell.rect.right - cell.rect.left) / MAX_COLUMNS;
	return {
		from: cell.pos,
		to: cell.pos,
		top: cell.rect.top,
		left: side === 'left' ? cell.rect.left : cell.rect.right - width,
		width,
		height: cell.rect.bottom - cell.rect.top,
		replaces: false,
		beside: cell.pos,
		side,
		full: item.cells.length >= MAX_COLUMNS
	};
}

export function dropTarget(view: EditorView, x: number, y: number): DropTarget | undefined {
	const item = nearest(placedItems(view), y);
	if (!item) return undefined;
	const { rect } = item;
	if (item.empty) {
		return {
			from: item.offset,
			to: item.offset + item.size,
			top: rect.top,
			left: rect.left,
			width: rect.width,
			height: rect.height,
			replaces: true
		};
	}
	const inside = y >= rect.top && y <= rect.bottom;
	const cell = inside ? cellAt(item, x) : undefined;
	const side = cell ? sideOf(cell, x) : undefined;
	if (cell && side) return besideTarget(item, cell, side);
	const below = y > rect.top + rect.height / 2;
	const at = below ? item.offset + item.size : item.offset;
	return {
		from: at,
		to: at,
		top: below ? rect.bottom : rect.top,
		left: rect.left,
		width: rect.width,
		height: 0,
		replaces: false
	};
}
