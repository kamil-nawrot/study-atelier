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
	convertBlock,
	createBlock,
	createCloseUp,
	currentBlock,
	insertBeside,
	insertBlock,
	insertionRange,
	isTextKind,
	moveBeside,
	moveBlockTo,
	removeBlock,
	setArtworkAttributes,
	stepBlock,
	type BlockKind,
	type CloseUpAttributes,
	type CurrentBlock,
	type NewBlock,
	type TextKind
} from '#lib/exhibitions/editor/block-commands/block-commands.ts';
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

export const BLOCK_MIME = 'application/x-exhibition-block';

type Options = {
	host: HTMLElement;
	document: ExhibitionDocument;
	lookup: ArtworkLookup;
	onchange: (document: ExhibitionDocument) => void;
	onlimit: (message: string) => void;
};

function payloadOf(event: DragEvent): NewBlock | undefined {
	const raw = event.dataTransfer?.getData(BLOCK_MIME);
	if (!raw) return undefined;
	try {
		const payload = JSON.parse(raw) as { kind?: string; artworkId?: string };
		if (payload.kind === 'artwork' && typeof payload.artworkId === 'string') {
			return { kind: 'artwork', artworkId: payload.artworkId };
		}
		return payload.kind && isTextKind(payload.kind) ? { kind: payload.kind } : undefined;
	} catch {
		return undefined;
	}
}

export class ExhibitionEditor {
	bar = $state.raw<BlockBarState>();
	dropAt = $state.raw<DropTarget>();
	#editor: Editor;
	#moving: CurrentBlock | undefined;
	#onlimit: (message: string) => void;

	constructor({ host, document, lookup, onchange, onlimit }: Options) {
		this.#onlimit = onlimit;
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
				handleDrop: (view, event) => this.#drop(view, event)
			},
			onUpdate: ({ editor }) => onchange(editor.getJSON()),
			onSelectionUpdate: () => this.measure(),
			onTransaction: () => this.measure(),
			onBlur: () => setTimeout(() => this.measure(), 0),
			onFocus: () => this.measure()
		});
		const dom = this.#editor.view.dom;
		dom.addEventListener('dragover', this.#over);
		dom.addEventListener('dragleave', this.#leave);
		window.addEventListener('dragend', this.#end);
		window.addEventListener('drop', this.#end);
	}

	get view(): EditorView {
		return this.#editor.view;
	}

	destroy(): void {
		const dom = this.#editor.view.dom;
		dom.removeEventListener('dragover', this.#over);
		dom.removeEventListener('dragleave', this.#leave);
		window.removeEventListener('dragend', this.#end);
		window.removeEventListener('drop', this.#end);
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
		this.bar = {
			kind: block.node.type.name as BlockKind,
			index: block.index,
			count: block.count,
			bold: this.#editor.isActive('bold'),
			italic: this.#editor.isActive('italic'),
			note: Boolean(block.node.attrs.note),
			row: block.row !== undefined,
			rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
		};
	}

	hideBar(): void {
		this.bar = undefined;
	}

	#allowed(block: NewBlock): boolean {
		const document = this.#editor.getJSON();
		if (blockCountOf(document) >= MAX_BLOCKS) {
			this.#onlimit(m.exhibitions.limits.blocks);
			return false;
		}
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
		const document = this.#editor.getJSON();
		if (blockCountOf(document) >= MAX_BLOCKS) {
			this.#onlimit(m.exhibitions.limits.blocks);
			return;
		}
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

	#drop(view: EditorView, event: DragEvent): boolean {
		event.preventDefault();
		this.dropAt = undefined;
		const target = dropTarget(view, event.clientX, event.clientY);
		const dropped = payloadOf(event);
		if (target?.full) return true;
		if (target && dropped) this.#insertAt(dropped, target);
		else if (target && this.#moving) {
			const moving = this.#moving;
			this.#moving = undefined;
			if (target.side) {
				this.#moveBeside(moving, target);
			} else {
				view.dispatch(moveBlockTo(view.state, moving, target.from));
				view.focus();
			}
		}
		return true;
	}

	#over = (event: DragEvent): void => {
		event.preventDefault();
		this.dropAt = dropTarget(this.#editor.view, event.clientX, event.clientY);
	};

	#leave = (event: DragEvent): void => {
		const next = event.relatedTarget;
		if (!(next instanceof Node) || !this.#editor.view.dom.contains(next)) this.dropAt = undefined;
	};

	#end = (): void => {
		this.dropAt = undefined;
		this.#moving = undefined;
	};

	startMove(): boolean {
		const block = currentBlock(this.#editor.state);
		this.#moving = block;
		return block !== undefined;
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
