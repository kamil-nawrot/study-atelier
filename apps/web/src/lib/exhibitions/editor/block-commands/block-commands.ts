import type { Node as ProseNode, Schema } from '@tiptap/pm/model';
import { Fragment } from '@tiptap/pm/model';
import { NodeSelection, TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state';

export type BlockKind = 'textBlock' | 'heading' | 'quote' | 'artwork';

export type TextKind = 'textBlock' | 'heading' | 'quote';

export type CurrentBlock = {
	node: ProseNode;
	pos: number;
	index: number;
	count: number;
};

export type NewBlock = { kind: TextKind } | { kind: 'artwork'; artworkId: string };

const TEXT_KINDS: readonly string[] = ['textBlock', 'heading', 'quote'];

export function isTextKind(kind: string): kind is TextKind {
	return TEXT_KINDS.includes(kind);
}

export function currentBlock(state: EditorState): CurrentBlock | undefined {
	const { selection, doc } = state;
	const depth = selection instanceof NodeSelection ? 1 : selection.$from.depth;
	if (depth < 1) return undefined;
	const pos = selection instanceof NodeSelection ? selection.from : selection.$from.before(1);
	const node = doc.nodeAt(pos);
	if (!node) return undefined;
	return { node, pos, index: doc.resolve(pos).index(), count: doc.childCount };
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

function selectionInside(tr: Transaction, pos: number, node: ProseNode): Transaction {
	if (node.type.name === 'artwork') return tr.setSelection(NodeSelection.create(tr.doc, pos));
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
	const end = block.pos + block.node.nodeSize;
	return isEmptyBlock(block.node) ? { from: block.pos, to: end } : { from: end, to: end };
}

export function moveBlockTo(state: EditorState, block: CurrentBlock, target: number): Transaction {
	const end = block.pos + block.node.nodeSize;
	const tr = state.tr;
	if (target >= block.pos && target <= end) return tr;
	tr.delete(block.pos, end);
	const at = target > block.pos ? target - block.node.nodeSize : target;
	tr.insert(at, block.node);
	return tr.setSelection(NodeSelection.create(tr.doc, at)).scrollIntoView();
}

export function stepBlock(
	state: EditorState,
	block: CurrentBlock,
	step: -1 | 1
): Transaction | undefined {
	const neighbour = block.index + step;
	if (neighbour < 0 || neighbour >= block.count) return undefined;
	const other = state.doc.child(neighbour);
	const target =
		step < 0 ? block.pos - other.nodeSize : block.pos + block.node.nodeSize + other.nodeSize;
	return moveBlockTo(state, block, target);
}

export function removeBlock(state: EditorState, block: CurrentBlock): Transaction {
	const end = block.pos + block.node.nodeSize;
	const tr = state.tr;
	if (block.count === 1) {
		tr.replaceWith(block.pos, end, createBlock(state.schema, { kind: 'textBlock' }));
		return selectionInside(tr, block.pos, tr.doc.child(0));
	}
	tr.delete(block.pos, end);
	const near =
		TextSelection.findFrom(tr.doc.resolve(Math.min(block.pos, tr.doc.content.size)), -1, true) ??
		TextSelection.findFrom(tr.doc.resolve(Math.min(block.pos, tr.doc.content.size)), 1, true);
	return near ? tr.setSelection(near) : tr;
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
	const after = block.pos + block.node.nodeSize;
	const node = createBlock(state.schema, { kind: 'textBlock' });
	const tr = state.tr.insert(after, node);
	return selectionInside(tr, after, node).scrollIntoView();
}
