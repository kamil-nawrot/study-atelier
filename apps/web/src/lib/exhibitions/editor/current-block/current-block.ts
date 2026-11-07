import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { currentBlock } from '#lib/exhibitions/editor/block-commands/block-commands.ts';

export const CURRENT_CLASS = 'is-current';

export function currentDecoration(state: EditorState): DecorationSet {
	const block = currentBlock(state);
	if (!block) return DecorationSet.empty;
	return DecorationSet.create(state.doc, [
		Decoration.node(block.pos, block.pos + block.node.nodeSize, { class: CURRENT_CLASS })
	]);
}

export const CurrentBlockMark = Extension.create({
	name: 'currentBlockMark',
	addProseMirrorPlugins: () => [
		new Plugin({
			key: new PluginKey('currentBlockMark'),
			props: { decorations: currentDecoration }
		})
	]
});
