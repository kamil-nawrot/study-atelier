import type { Node as ProseNode, ResolvedPos, Schema } from '@tiptap/pm/model';
import { Fragment } from '@tiptap/pm/model';
import { NodeSelection, TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state';

export type BlockKind = 'textBlock' | 'heading' | 'quote' | 'artwork' | 'closeUp';

export type TextKind = 'textBlock' | 'heading' | 'quote';

export type Side = 'left' | 'right';

export const MAX_COLUMNS = 3;

export type RowOfBlock = {
	pos: number;
	node: ProseNode;
	columnPos: number;
	columnSize: number;
	column: number;
	columns: number;
};

export type CurrentBlock = {
	node: ProseNode;
	pos: number;
	index: number;
	count: number;
	row?: RowOfBlock;
};

export type NewBlock = { kind: TextKind } | { kind: 'artwork'; artworkId: string };

export type CloseUpAttributes = {
	artworkId: string;
	imageId: string | null;
	x: number;
	y: number;
	viewWidth: number;
};

const TEXT_KINDS: readonly string[] = ['textBlock', 'heading', 'quote'];

export function isTextKind(kind: string): kind is TextKind {
	return TEXT_KINDS.includes(kind);
}

function holdsBlocks(node: ProseNode): boolean {
	return node.type.name === 'doc' || node.type.name === 'column';
}

function describe(doc: ProseNode, node: ProseNode, pos: number): CurrentBlock {
	const at = doc.resolve(pos);
	if (at.parent.type.name !== 'column') {
		return { node, pos, index: at.index(0), count: doc.childCount };
	}
	const rowDepth = at.depth - 1;
	const row = at.node(rowDepth);
	const columnPos = at.before(at.depth);
	return {
		node,
		pos,
		index: at.index(rowDepth),
		count: row.childCount,
		row: {
			pos: at.before(rowDepth),
			node: row,
			columnPos,
			columnSize: at.parent.nodeSize,
			column: at.index(rowDepth),
			columns: row.childCount
		}
	};
}

export function blockAt(doc: ProseNode, pos: number): CurrentBlock | undefined {
	const node = doc.nodeAt(pos);
	return node ? describe(doc, node, pos) : undefined;
}

export function blockDepthOf($pos: ResolvedPos): number {
	for (let depth = $pos.depth; depth >= 1; depth -= 1) {
		const parent = $pos.node(depth - 1);
		if (parent.type.name === 'column') return depth;
		if (parent.type.name === 'doc' && $pos.node(depth).type.name !== 'columns') return depth;
	}
	return 0;
}

export function currentBlock(state: EditorState): CurrentBlock | undefined {
	const { selection, doc } = state;
	if (
		selection instanceof NodeSelection &&
		holdsBlocks(selection.$from.parent) &&
		selection.node.type.name !== 'columns'
	) {
		return describe(doc, selection.node, selection.from);
	}
	const depth = blockDepthOf(selection.$from);
	if (depth < 1) return undefined;
	return describe(doc, selection.$from.node(depth), selection.$from.before(depth));
}

function endOf(block: CurrentBlock): number {
	return block.row ? block.row.pos + block.row.node.nodeSize : block.pos + block.node.nodeSize;
}

export function isEmptyBlock(node: ProseNode): boolean {
	return (
		isTextKind(node.type.name) && node.textContent === '' && node.childCount <= 1 && !hasList(node)
	);
}

function hasList(node: ProseNode): boolean {
	let found = false;
	node.descendants((child) => {
		if (child.type.name === 'bulletList' || child.type.name === 'orderedList') found = true;
		return !found;
	});
	return found;
}

export function createBlock(schema: Schema, block: NewBlock): ProseNode {
	if (block.kind === 'artwork') return schema.nodes.artwork.create({ artworkId: block.artworkId });
	const node = schema.nodes[block.kind].createAndFill();
	if (!node) throw new Error(`cannot create a ${block.kind}`);
	return node;
}

export function createCloseUp(schema: Schema, attributes: CloseUpAttributes): ProseNode {
	return schema.nodes.closeUp.create(attributes);
}

function isPicture(node: ProseNode): boolean {
	return node.type.name === 'artwork' || node.type.name === 'closeUp';
}

function selectionInside(tr: Transaction, pos: number, node: ProseNode): Transaction {
	if (isPicture(node)) return tr.setSelection(NodeSelection.create(tr.doc, pos));
	const near = TextSelection.findFrom(tr.doc.resolve(pos + 1), 1, true);
	return near ? tr.setSelection(near) : tr;
}

export function insertBlock(
	state: EditorState,
	node: ProseNode,
	from: number,
	to = from
): Transaction {
	const tr = state.tr;
	if (to > from) tr.replaceWith(from, to, node);
	else tr.insert(from, node);
	return selectionInside(tr, from, node).scrollIntoView();
}

export function insertionRange(state: EditorState): { from: number; to: number } {
	const block = currentBlock(state);
	if (!block) return { from: state.doc.content.size, to: state.doc.content.size };
	if (block.row) {
		const end = endOf(block);
		return { from: end, to: end };
	}
	const end = block.pos + block.node.nodeSize;
	return isEmptyBlock(block.node) ? { from: block.pos, to: end } : { from: end, to: end };
}

function sourceRange(block: CurrentBlock): { from: number; to: number } {
	return block.row
		? { from: block.row.columnPos, to: block.row.columnPos + block.row.columnSize }
		: { from: block.pos, to: block.pos + block.node.nodeSize };
}

export function moveBlockTo(state: EditorState, block: CurrentBlock, target: number): Transaction {
	const { from, to } = sourceRange(block);
	const tr = state.tr;
	if (target >= from && target <= to) return tr;
	tr.delete(from, to);
	const at = tr.mapping.map(target);
	tr.insert(at, block.node);
	return tr.setSelection(NodeSelection.create(tr.doc, at)).scrollIntoView();
}

function stepColumn(
	state: EditorState,
	block: CurrentBlock,
	row: RowOfBlock,
	step: -1 | 1
): Transaction | undefined {
	const neighbour = row.column + step;
	if (neighbour < 0 || neighbour >= row.columns) return undefined;
	const other = row.node.child(neighbour);
	const column = row.node.child(row.column);
	const tr = state.tr;
	const target =
		step < 0 ? row.columnPos - other.nodeSize : row.columnPos + column.nodeSize + other.nodeSize;
	tr.delete(row.columnPos, row.columnPos + column.nodeSize);
	const at = tr.mapping.map(target);
	tr.insert(at, column);
	return tr.setSelection(NodeSelection.create(tr.doc, at + 1)).scrollIntoView();
}

export function stepBlock(
	state: EditorState,
	block: CurrentBlock,
	step: -1 | 1
): Transaction | undefined {
	if (block.row) return stepColumn(state, block, block.row, step);
	const neighbour = block.index + step;
	if (neighbour < 0 || neighbour >= block.count) return undefined;
	const other = state.doc.child(neighbour);
	const target =
		step < 0 ? block.pos - other.nodeSize : block.pos + block.node.nodeSize + other.nodeSize;
	return moveBlockTo(state, block, target);
}

export function removeBlock(state: EditorState, block: CurrentBlock): Transaction {
	const { from, to } = sourceRange(block);
	const tr = state.tr;
	if (!block.row && block.count === 1) {
		tr.replaceWith(block.pos, to, createBlock(state.schema, { kind: 'textBlock' }));
		return selectionInside(tr, block.pos, tr.doc.child(0));
	}
	tr.delete(from, to);
	const at = Math.min(tr.mapping.map(from), tr.doc.content.size);
	const near =
		TextSelection.findFrom(tr.doc.resolve(at), -1, true) ??
		TextSelection.findFrom(tr.doc.resolve(at), 1, true);
	return near ? tr.setSelection(near) : tr;
}

export function canJoinRow(target: CurrentBlock): boolean {
	return !target.row || target.row.columns < MAX_COLUMNS;
}

function placeBeside(
	tr: Transaction,
	schema: Schema,
	target: CurrentBlock,
	side: Side,
	node: ProseNode
): number | undefined {
	if (!canJoinRow(target)) return undefined;
	const { column, columns } = schema.nodes;
	if (target.row) {
		const at =
			side === 'left' ? target.row.columnPos : target.row.columnPos + target.row.columnSize;
		tr.insert(at, column.create(null, node));
		return at + 1;
	}
	const first = side === 'left' ? node : target.node;
	const second = side === 'left' ? target.node : node;
	const row = columns.create(null, [column.create(null, first), column.create(null, second)]);
	tr.replaceWith(target.pos, target.pos + target.node.nodeSize, row);
	return target.pos + 2 + (side === 'left' ? 0 : column.create(null, first).nodeSize);
}

export function insertBeside(
	state: EditorState,
	target: CurrentBlock,
	side: Side,
	node: ProseNode
): Transaction | undefined {
	const tr = state.tr;
	const at = placeBeside(tr, state.schema, target, side, node);
	return at === undefined ? undefined : selectionInside(tr, at, node).scrollIntoView();
}

export function moveBeside(
	state: EditorState,
	block: CurrentBlock,
	target: CurrentBlock,
	side: Side
): Transaction | undefined {
	if (block.pos === target.pos) return undefined;
	const tr = state.tr;
	const at = placeBeside(tr, state.schema, target, side, block.node);
	if (at === undefined) return undefined;
	const { from, to } = sourceRange(block);
	tr.delete(tr.mapping.map(from, 1), tr.mapping.map(to, -1));
	return tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map(at))).scrollIntoView();
}

function paragraphsOf(node: ProseNode): Fragment[] {
	if (node.isTextblock) return [node.content];
	const found: Fragment[] = [];
	node.descendants((child) => {
		if (child.isTextblock) {
			found.push(child.content);
			return false;
		}
		return true;
	});
	return found.length > 0 ? found : [Fragment.empty];
}

function headingContent(schema: Schema, paragraphs: Fragment[]): Fragment {
	let joined = Fragment.empty;
	paragraphs.forEach((content, index) => {
		if (index > 0) joined = joined.append(Fragment.from(schema.text(' ')));
		joined = joined.append(content);
	});
	const allowed = schema.nodes.heading.spec.marks === 'italic' ? ['italic'] : [];
	const children: ProseNode[] = [];
	joined.forEach((child) => {
		children.push(child.mark(child.marks.filter((mark) => allowed.includes(mark.type.name))));
	});
	return Fragment.fromArray(children);
}

export function convertBlock(state: EditorState, block: CurrentBlock, to: TextKind): Transaction {
	const { schema } = state;
	const paragraphs = paragraphsOf(block.node);
	const node =
		to === 'heading'
			? schema.nodes.heading.create(null, headingContent(schema, paragraphs))
			: schema.nodes[to].create(
					null,
					paragraphs.map((content) => schema.nodes.paragraph.create(null, content))
				);
	const tr = state.tr.replaceWith(block.pos, block.pos + block.node.nodeSize, node);
	return selectionInside(tr, block.pos, node);
}

export function setArtworkAttributes(
	state: EditorState,
	block: CurrentBlock,
	patch: Record<string, unknown>
): Transaction {
	const tr = state.tr.setNodeMarkup(block.pos, null, { ...block.node.attrs, ...patch });
	return tr.setSelection(NodeSelection.create(tr.doc, block.pos));
}

export function emptyBlockAfter(state: EditorState, block: CurrentBlock): Transaction {
	const after = endOf(block);
	const node = createBlock(state.schema, { kind: 'textBlock' });
	const tr = state.tr.insert(after, node);
	return selectionInside(tr, after, node).scrollIntoView();
}
