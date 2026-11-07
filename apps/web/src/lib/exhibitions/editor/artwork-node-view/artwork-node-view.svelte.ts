import type { NodeViewRenderer } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { mount, unmount } from 'svelte';
import ArtworkFigure from '#lib/exhibitions/components/ArtworkFigure/ArtworkFigure.svelte';
import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';

export function artworkNodeView(lookup: ArtworkLookup): NodeViewRenderer {
	return ({ node, getPos, editor }) => {
		const dom = document.createElement('div');
		dom.className = 'artwork-block';
		const props = $state({
			artworkId: String(node.attrs.artworkId),
			showNote: Boolean(node.attrs.note),
			empty: node.content.size === 0,
			selected: false
		});
		const component = mount(ArtworkFigure, {
			target: dom,
			props: {
				lookup,
				editable: true,
				get artworkId() {
					return props.artworkId;
				},
				get showNote() {
					return props.showNote;
				},
				get empty() {
					return props.empty;
				},
				get selected() {
					return props.selected;
				},
				onselect: () => {
					const pos = getPos();
					if (pos === undefined || !editor.isEditable) return;
					editor.view.focus();
					editor.view.dispatch(
						editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos))
					);
				}
			}
		});
		const caption = dom.querySelector<HTMLElement>('[data-caption]');
		if (!caption) throw new Error('the artwork block has no caption');

		return {
			dom,
			contentDOM: caption,
			update(next) {
				if (next.type !== node.type) return false;
				props.artworkId = String(next.attrs.artworkId);
				props.showNote = Boolean(next.attrs.note);
				props.empty = next.content.size === 0;
				return true;
			},
			selectNode() {
				props.selected = true;
			},
			deselectNode() {
				props.selected = false;
			},
			ignoreMutation: (mutation) =>
				mutation.type !== 'selection' && !caption.contains(mutation.target),
			destroy() {
				void unmount(component);
			}
		};
	};
}
