import { TextSelection } from '@tiptap/pm/state';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { ExhibitionEditor } from '#lib/exhibitions/editor/exhibition-editor/exhibition-editor.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

type Node = ExhibitionDocument;

export function text(value: string, marks: { type: string }[] = []): Node {
	return { type: 'text', text: value, ...(marks.length > 0 ? { marks } : {}) };
}

export function paragraph(value: string): Node {
	return value === '' ? { type: 'paragraph' } : { type: 'paragraph', content: [text(value)] };
}

export function textBlock(...values: string[]): Node {
	return { type: 'textBlock', content: values.map(paragraph) };
}

export function heading(value: string): Node {
	return {
		type: 'heading',
		attrs: { level: 2 },
		...(value === '' ? {} : { content: [text(value)] })
	};
}

export function artwork(artworkId: string): Node {
	return { type: 'artwork', attrs: { artworkId } };
}

export function closeUp(artworkId: string, x = 0.5, y = 0.5, viewWidth = 0.25): Node {
	return { type: 'closeUp', attrs: { artworkId, imageId: null, x, y, viewWidth } };
}

export function columns(...blocks: Node[]): Node {
	return {
		type: 'columns',
		content: blocks.map((block) => ({ type: 'column', content: [block] }))
	};
}

export function doc(...content: Node[]): ExhibitionDocument {
	return { type: 'doc', content };
}

export class EditorHarness {
	host!: HTMLElement;
	editor: ExhibitionEditor | undefined;
	changes: ExhibitionDocument[] = [];
	limits: string[] = [];

	setup(): void {
		this.host = document.createElement('div');
		document.body.appendChild(this.host);
		this.changes = [];
		this.limits = [];
	}

	teardown(): void {
		this.editor?.destroy();
		this.editor = undefined;
		this.host.remove();
	}

	open(content: ExhibitionDocument): ExhibitionEditor {
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(1, 'Judith'), testArtwork(2, 'Olympia')]);
		this.editor = new ExhibitionEditor({
			host: this.host,
			document: content,
			lookup,
			onchange: (changed) => this.changes.push(changed),
			onlimit: (message) => this.limits.push(message)
		});
		return this.editor;
	}

	press(key: string): boolean {
		const view = this.opened().view;
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		return Boolean(view.someProp('handleKeyDown', (handle) => handle(view, event)));
	}

	placeCursor(block: number): void {
		const { view } = this.opened();
		const { state } = view;
		let pos = 0;
		for (let index = 0; index < block; index += 1) pos += state.doc.child(index).nodeSize;
		view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(pos + 1), 1)));
	}

	kinds(): string[] {
		return (this.changes.at(-1)?.content ?? []).map((block) => block.type ?? '');
	}

	opened(): ExhibitionEditor {
		if (!this.editor) throw new Error('the editor is not open');
		return this.editor;
	}
}
