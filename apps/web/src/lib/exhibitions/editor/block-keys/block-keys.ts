import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
	createBlock,
	currentBlock,
	emptyBlockAfter,
	isEmptyBlock,
	removeBlock
} from '#lib/exhibitions/editor/block-commands/block-commands.ts';

type BlockKeysOptions = {
	bodyHint: string;
	headingHint: string;
};

const EXIT_AFTER_ENTER = ['heading', 'artwork'];

function placeholders(state: EditorState, options: BlockKeysOptions): DecorationSet {
	const decorations: Decoration[] = [];
	const last = state.doc.lastChild;
	state.doc.forEach((node, offset) => {
		const hint =
			node.type.name === 'heading'
				? options.headingHint
				: node === last && isEmptyBlock(node)
					? options.bodyHint
					: undefined;
		if (hint === undefined || node.textContent !== '') return;
		const target = node.type.name === 'textBlock' ? offset + 1 : offset;
		const inner = node.type.name === 'textBlock' ? node.firstChild : node;
		if (!inner) return;
		decorations.push(
			Decoration.node(target, target + inner.nodeSize, {
				class: 'is-empty',
				'data-placeholder': hint
			})
		);
	});
	return DecorationSet.create(state.doc, decorations);
}

export const ExhibitionBlocks = Extension.create<BlockKeysOptions>({
	name: 'exhibitionBlocks',
	priority: 1000,
	addOptions: () => ({ bodyHint: '', headingHint: '' }),
	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }) => {
				const { state } = editor;
				const block = currentBlock(state);
				if (!block || !EXIT_AFTER_ENTER.includes(block.node.type.name)) return false;
				if (!state.selection.empty) return false;
				editor.view.dispatch(emptyBlockAfter(state, block));
				return true;
			},
			Backspace: ({ editor }) => {
				const { state } = editor;
				const block = currentBlock(state);
				if (!block || !state.selection.empty || !isEmptyBlock(block.node)) return false;
				if (block.count < 2 || state.selection.$from.parentOffset !== 0) return false;
				editor.view.dispatch(removeBlock(state, block));
				return true;
			}
		};
	},
	addProseMirrorPlugins() {
		const options = this.options;
		return [
			new Plugin({
				key: new PluginKey('exhibitionPlaceholders'),
				props: { decorations: (state) => placeholders(state, options) }
			}),
			new Plugin({
				key: new PluginKey('exhibitionTrailingText'),
				appendTransaction(transactions, _before, state) {
					if (!transactions.some((transaction) => transaction.docChanged)) return null;
					const last = state.doc.lastChild;
					if (last && last.type.name === 'textBlock' && isEmptyBlock(last)) return null;
					return state.tr.insert(
						state.doc.content.size,
						createBlock(state.schema, { kind: 'textBlock' })
					);
				}
			}),
			new Plugin({
				key: new PluginKey('exhibitionSelectionInOneBlock'),
				appendTransaction(_transactions, _before, state) {
					const { selection } = state;
					if (!(selection instanceof TextSelection) || selection.empty) return null;
					const anchor = selection.$anchor;
					const head = selection.$head;
					if (anchor.depth < 1 || head.depth < 1) return null;
					if (anchor.before(1) === head.before(1)) return null;
					const edge =
						head.pos > anchor.pos
							? TextSelection.findFrom(state.doc.resolve(anchor.after(1) - 1), -1, true)
							: TextSelection.findFrom(state.doc.resolve(anchor.before(1) + 1), 1, true);
					return edge
						? state.tr.setSelection(TextSelection.create(state.doc, anchor.pos, edge.head))
						: null;
				}
			})
		];
	}
});
