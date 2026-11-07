import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { closeUpNodeView } from '#lib/exhibitions/editor/close-up-node-view/close-up-node-view.svelte.ts';
import { CloseUpNode } from '#lib/exhibitions/editor/close-up-node/close-up-node.ts';
import { artworkNodeView } from '#lib/exhibitions/editor/artwork-node-view/artwork-node-view.svelte.ts';
import { ArtworkNode } from '#lib/exhibitions/editor/artwork-node/artwork-node.ts';
import { ExhibitionBlocks } from '#lib/exhibitions/editor/block-keys/block-keys.ts';
import {
	Column,
	Columns,
	ExhibitionDoc,
	ExhibitionHeading,
	Quote,
	TextBlock
} from '#lib/exhibitions/editor/block-nodes/block-nodes.ts';
import {
	blockAt,
	canJoinRow,
	createBlock,
	createCloseUp,
	currentBlock,
	insertBeside,
	insertBlock,
	insertionRange,
	moveBeside,
	moveBlockTo,
	removeBlock,
	stepBlock,
	type BlockKind,
	type CloseUpAttributes,
	type CurrentBlock,
	type NewBlock,
	type TextKind
} from '#lib/exhibitions/editor/block-commands/block-commands.ts';
import {
	convertBlock,
	setArtworkAttributes
} from '#lib/exhibitions/editor/block-conversion/block-conversion.ts';
import { CurrentBlockMark } from '#lib/exhibitions/editor/current-block/current-block.ts';
import { dropTarget, type DropTarget } from '#lib/exhibitions/editor/block-drop/block-drop.ts';
import {
	MAX_ARTWORKS,
	MAX_BLOCKS,
	artworkIdsOf,
	blockCountOf
} from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import type { BlockBarState } from '#lib/exhibitions/types/block-bar-state.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

type Options = {
	host: HTMLElement;
	document: ExhibitionDocument;
	lookup: ArtworkLookup;
	onchange: (document: ExhibitionDocument) => void;
	onlimit: (message: string) => void;
};

export class ExhibitionEditor {
	bar = $state.raw<BlockBarState>();
	dropAt = $state.raw<DropTarget>();
	#editor: Editor;
	#moving: CurrentBlock | undefined;
	#host: HTMLElement;
	#onlimit: (message: string) => void;

	constructor({ host, document, lookup, onchange, onlimit }: Options) {
		this.#onlimit = onlimit;
		this.#host = host;
		this.#editor = new Editor({
			element: host,
			content: document,
			extensions: [
				StarterKit.configure({
					document: false,
					heading: false,
					blockquote: false,
					code: false,
					codeBlock: false,
					hardBreak: false,
					horizontalRule: false,
					link: false,
					strike: false,
					underline: false,
					dropcursor: false,
					gapcursor: false,
					trailingNode: false
				}),
				ExhibitionDoc,
				TextBlock,
				ExhibitionHeading,
				Quote,
				ArtworkNode.configure({ nodeView: artworkNodeView(lookup) }),
				CloseUpNode.configure({ nodeView: closeUpNodeView(lookup) }),
				Columns,
				Column,
				CurrentBlockMark,
				ExhibitionBlocks.configure({
					bodyHint: m.exhibitions.view.emptyBody,
					headingHint: m.exhibitions.view.headingHint
				})
			],
			editorProps: {
				attributes: {
					role: 'textbox',
					'aria-multiline': 'true',
					'aria-label': m.exhibitions.view.bodyLabel
				},
				handleDrop: () => true
			},
			onUpdate: ({ editor }) => onchange(editor.getJSON()),
			onSelectionUpdate: () => this.measure(),
			onTransaction: () => this.measure(),
			onBlur: () => setTimeout(() => this.measure(), 0),
			onFocus: () => this.measure()
		});
	}

	get view(): EditorView {
		return this.#editor.view;
	}

	destroy(): void {
		this.#editor.destroy();
	}

	measure(): void {
		if (this.#editor.isDestroyed) return;
		const { state, view } = this.#editor;
		const block = currentBlock(state);
		if (!block || (!view.hasFocus() && !this.bar)) {
			this.bar = undefined;
			return;
		}
		const dom = view.nodeDOM(block.pos);
		if (!(dom instanceof HTMLElement)) {
			this.bar = undefined;
			return;
		}
		const rect = dom.getBoundingClientRect();
		const origin = this.#host.getBoundingClientRect();
		this.bar = {
			kind: block.node.type.name as BlockKind,
			index: block.index,
			count: block.count,
			bold: this.#editor.isActive('bold'),
			italic: this.#editor.isActive('italic'),
			note: Boolean(block.node.attrs.note),
			palette: Boolean(block.node.attrs.palette),
			paletteOnly: Boolean(block.node.attrs.paletteOnly),
			row: block.row !== undefined,
			artworkId: block.node.attrs.artworkId ? String(block.node.attrs.artworkId) : undefined,
			rect: {
				top: rect.top - origin.top,
				bottom: rect.bottom - origin.top,
				left: rect.left - origin.left,
				right: rect.right - origin.left
			}
		};
	}

	hideBar(): void {
		this.bar = undefined;
	}

	#roomForBlock(): boolean {
		if (blockCountOf(this.#editor.getJSON()) < MAX_BLOCKS) return true;
		this.#onlimit(m.exhibitions.limits.blocks);
		return false;
	}

	#allowed(block: NewBlock): boolean {
		if (!this.#roomForBlock()) return false;
		const document = this.#editor.getJSON();
		if (
			block.kind === 'artwork' &&
			!artworkIdsOf(document).includes(block.artworkId) &&
			artworkIdsOf(document).length >= MAX_ARTWORKS
		) {
			this.#onlimit(m.exhibitions.limits.artworks);
			return false;
		}
		return true;
	}

	add(block: NewBlock): void {
		if (!this.#allowed(block)) return;
		const { state, view } = this.#editor;
		const { from, to } = insertionRange(state);
		view.dispatch(insertBlock(state, createBlock(state.schema, block), from, to));
		view.focus();
	}

	#insertAt(block: NewBlock, target: DropTarget): void {
		if (!this.#allowed(block)) return;
		const { state, view } = this.#editor;
		const node = createBlock(state.schema, block);
		const beside = target.beside === undefined ? undefined : blockAt(state.doc, target.beside);
		if (beside && target.side) {
			const tr = insertBeside(state, beside, target.side, node);
			if (tr) view.dispatch(tr);
		} else {
			view.dispatch(insertBlock(state, node, target.from, target.to));
		}
		view.focus();
	}

	#moveBeside(moving: CurrentBlock, target: DropTarget): void {
		const { state, view } = this.#editor;
		const beside = target.beside === undefined ? undefined : blockAt(state.doc, target.beside);
		const tr = beside && target.side && moveBeside(state, moving, beside, target.side);
		if (tr) view.dispatch(tr);
		view.focus();
	}

	addCloseUp(attributes: CloseUpAttributes): void {
		if (!this.#roomForBlock()) return;
		const { state, view } = this.#editor;
		const node = createCloseUp(state.schema, attributes);
		const current = currentBlock(state);
		const beside = current && canJoinRow(current) && insertBeside(state, current, 'right', node);
		if (beside) {
			view.dispatch(beside);
		} else {
			const { from, to } = insertionRange(state);
			view.dispatch(insertBlock(state, node, from, to));
		}
		view.focus();
	}

	#targetAt(x: number, y: number): DropTarget | undefined {
		const bounds = this.#host.getBoundingClientRect();
		if (x < bounds.left || x > bounds.right) return undefined;
		return dropTarget(this.#editor.view, x, y);
	}

	hover(x: number, y: number): void {
		this.dropAt = this.#targetAt(x, y);
	}

	place(block: NewBlock | undefined, x: number, y: number): void {
		const { view } = this.#editor;
		const target = this.#targetAt(x, y);
		const moving = this.#moving;
		this.endDrag();
		if (!target) return;
		const within =
			moving?.row !== undefined &&
			target.beside !== undefined &&
			blockAt(view.state.doc, target.beside)?.row?.pos === moving.row.pos;
		if (target.full && !within) return;
		if (block) this.#insertAt(block, target);
		else if (moving && target.side) this.#moveBeside(moving, target);
		else if (moving) {
			view.dispatch(moveBlockTo(view.state, moving, target.from));
			view.focus();
		}
	}

	endDrag(): void {
		this.dropAt = undefined;
		this.#moving = undefined;
	}

	startMove(): CurrentBlock | undefined {
		const block = currentBlock(this.#editor.state);
		this.#moving = block;
		return block;
	}

	pickUp(dom: Element): CurrentBlock | undefined {
		const { view } = this.#editor;
		let found: number | undefined;
		view.state.doc.descendants((_, pos) => {
			if (found === undefined && view.nodeDOM(pos) === dom) found = pos;
			return found === undefined;
		});
		if (found === undefined) return undefined;
		view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, found)));
		return this.startMove();
	}

	convert(kind: TextKind): void {
		const { state, view } = this.#editor;
		const block = currentBlock(state);
		if (!block || block.node.type.name === kind) return;
		view.dispatch(convertBlock(state, block, kind));
		view.focus();
	}

	step(direction: -1 | 1): void {
		const { state, view } = this.#editor;
		const block = currentBlock(state);
		const tr = block && stepBlock(state, block, direction);
		if (tr) view.dispatch(tr);
		view.focus();
	}

	remove(): void {
		const { state, view } = this.#editor;
		const block = currentBlock(state);
		if (block) view.dispatch(removeBlock(state, block));
		view.focus();
	}

	toggle(mark: 'bold' | 'italic'): void {
		const chain = this.#editor.chain().focus();
		(mark === 'bold' ? chain.toggleBold() : chain.toggleItalic()).run();
	}

	setArtwork(patch: Record<string, unknown>): void {
		const { state, view } = this.#editor;
		const block = currentBlock(state);
		if (!block || block.node.type.name !== 'artwork') return;
		view.dispatch(setArtworkAttributes(state, block, patch));
		view.focus();
	}

	get selectedArtwork(): boolean {
		return this.#editor.state.selection instanceof NodeSelection;
	}
}
