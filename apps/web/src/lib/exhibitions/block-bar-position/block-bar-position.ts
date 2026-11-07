type Edges = { top: number; bottom: number; left: number; right: number };

type Size = { width: number; height: number };

type Position = { top: number; left: number };

const GAP = 10;

export function barPosition(block: Edges, bar: Size, column: Edges, topLimit: number): Position {
	const above = block.top - bar.height - GAP;
	const top = above >= topLimit ? above : block.bottom + GAP;
	const rightmost = column.right - bar.width;
	const left = Math.max(column.left, Math.min(block.left, rightmost));
	return { top, left };
}
