import type { EditorView } from '@tiptap/pm/view';
import { isEmptyBlock } from '#lib/exhibitions/editor/block-commands/block-commands.ts';

export type DropTarget = {
	from: number;
	to: number;
	top: number;
	left: number;
	width: number;
	height: number;
	replaces: boolean;
};

type Placed = { offset: number; size: number; empty: boolean; rect: DOMRect };

function placedBlocks(view: EditorView): Placed[] {
	const placed: Placed[] = [];
	view.state.doc.forEach((node, offset) => {
		const dom = view.nodeDOM(offset);
		if (dom instanceof HTMLElement) {
			placed.push({
				offset,
				size: node.nodeSize,
				empty: isEmptyBlock(node),
				rect: dom.getBoundingClientRect()
			});
		}
	});
	return placed;
}

function nearest(blocks: Placed[], y: number): Placed | undefined {
	let best: Placed | undefined;
	let distance = Infinity;
	for (const block of blocks) {
		const gap =
			y < block.rect.top ? block.rect.top - y : y > block.rect.bottom ? y - block.rect.bottom : 0;
		if (gap < distance) {
			best = block;
			distance = gap;
		}
	}
	return best;
}

export function dropTarget(view: EditorView, y: number): DropTarget | undefined {
	const block = nearest(placedBlocks(view), y);
	if (!block) return undefined;
	const { rect } = block;
	if (block.empty) {
		return {
			from: block.offset,
			to: block.offset + block.size,
			top: rect.top,
			left: rect.left,
			width: rect.width,
			height: rect.height,
			replaces: true
		};
	}
	const below = y > rect.top + rect.height / 2;
	const at = below ? block.offset + block.size : block.offset;
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
