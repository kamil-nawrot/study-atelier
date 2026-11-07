import type { NodeViewRenderer } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { mount, unmount } from 'svelte';
import CloseUpFigure from '#lib/exhibitions/components/CloseUpFigure/CloseUpFigure.svelte';
import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';

export function closeUpNodeView(lookup: ArtworkLookup): NodeViewRenderer {
	return ({ node, getPos, editor }) => {
		const dom = document.createElement('div');
		dom.className = 'close-up-block';
		const props = $state({
			artworkId: String(node.attrs.artworkId),
			imageId: node.attrs.imageId as string | null,
			x: Number(node.attrs.x),
			y: Number(node.attrs.y),
			viewWidth: Number(node.attrs.viewWidth),
			selected: false
		});
		const component = mount(CloseUpFigure, {
			target: dom,
			props: {
				lookup,
				editable: true,
				get artworkId() {
					return props.artworkId;
				},
				get imageId() {
					return props.imageId;
				},
				get x() {
					return props.x;
				},
				get y() {
					return props.y;
				},
				get viewWidth() {
					return props.viewWidth;
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

		return {
			dom,
			update(next) {
				if (next.type !== node.type) return false;
				props.artworkId = String(next.attrs.artworkId);
				props.imageId = next.attrs.imageId as string | null;
				props.x = Number(next.attrs.x);
				props.y = Number(next.attrs.y);
				props.viewWidth = Number(next.attrs.viewWidth);
				return true;
			},
			selectNode() {
				props.selected = true;
			},
			deselectNode() {
				props.selected = false;
			},
			ignoreMutation: () => true,
			destroy() {
				void unmount(component);
			}
		};
	};
}
