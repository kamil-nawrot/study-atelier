import type { Node as ProseNode, Schema } from '@tiptap/pm/model';
import { Fragment } from '@tiptap/pm/model';
import { NodeSelection, type EditorState, type Transaction } from '@tiptap/pm/state';
import {
	selectionInside,
	type CurrentBlock,
	type TextKind
} from '#lib/exhibitions/editor/block-commands/block-commands.ts';

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
