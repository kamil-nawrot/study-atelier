import { TextSelection } from '@tiptap/pm/state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import { BLOCK_MIME, ExhibitionEditor } from './exhibition-editor.svelte.ts';

vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));

vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworkNotes: vi.fn().mockResolvedValue({ notes: new Map() })
}));

const paragraph = (text: string): ExhibitionDocument => ({
	type: 'doc',
	content: [
		{
			type: 'textBlock',
			content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
		}
	]
});

let host: HTMLElement;
let editor: ExhibitionEditor;
let changes: ExhibitionDocument[];
let limits: string[];

function open(document: ExhibitionDocument): void {
	const lookup = new ArtworkLookup();
	lookup.add([testArtwork(1, 'Judith'), testArtwork(2, 'Olympia')]);
	editor = new ExhibitionEditor({
		host,
		document,
		lookup,
		onchange: (changed) => changes.push(changed),
		onlimit: (message) => limits.push(message)
	});
}

function kinds(): string[] {
	return (changes.at(-1)?.content ?? []).map((block) => block.type ?? '');
}

beforeEach(() => {
	host = document.createElement('div');
	document.body.appendChild(host);
	changes = [];
	limits = [];
});

afterEach(() => {
	editor.destroy();
	host.remove();
});

describe('ExhibitionEditor', () => {
	it('adds a block under the one the learner is in', () => {
		open(paragraph('One'));
		editor.view.focus();

		editor.add({ kind: 'heading' });
		expect(kinds()).toContain('heading');

		editor.add({ kind: 'artwork', artworkId: 'artwork-1' });
		expect(kinds()).toContain('artwork');
		expect(host.querySelector('figure')).not.toBeNull();
	});

	it('turns a text block into a quote and back', () => {
		open(paragraph('One'));
		editor.view.focus();

		editor.convert('quote');
		expect(kinds()[0]).toBe('quote');

		editor.convert('textBlock');
		expect(kinds()[0]).toBe('textBlock');
	});

	it('removes an artwork block from the exhibition', () => {
		open({
			type: 'doc',
			content: [{ type: 'artwork', attrs: { artworkId: 'artwork-2' } }, ...paragraph('x').content!]
		});
		editor.view.focus();

		editor.remove();

		expect(kinds()).not.toContain('artwork');
	});

	it('refuses a block over the limit of 300 blocks and says so', () => {
		const block = { type: 'quote', content: [{ type: 'paragraph' }] };
		open({ type: 'doc', content: Array.from({ length: 300 }, () => block) });

		editor.add({ kind: 'textBlock' });

		expect(limits).toEqual([m.exhibitions.limits.blocks]);
		expect(changes).toEqual([]);
	});

	it('refuses a hundred and first artwork but accepts one it already shows', () => {
		const blocks = Array.from({ length: 100 }, (_, index) => ({
			type: 'artwork',
			attrs: { artworkId: `artwork-${index + 1}` }
		}));
		open({ type: 'doc', content: blocks });

		editor.add({ kind: 'artwork', artworkId: 'artwork-new' });
		expect(limits).toEqual([m.exhibitions.limits.artworks]);

		editor.add({ kind: 'artwork', artworkId: 'artwork-1' });
		expect(limits).toHaveLength(1);
		expect(kinds().filter((kind) => kind === 'artwork')).toHaveLength(101);
	});

	it('keeps the blocks in order when one steps down', () => {
		open({
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'H' }] },
				...paragraph('P').content!
			]
		});
		editor.view.focus();

		editor.step(1);

		expect(kinds().slice(0, 2)).toEqual(['textBlock', 'heading']);
	});

	describe('dragging', () => {
		function dragEvent(type: string, y: number, payload?: object, x?: number): DragEvent {
			const dataTransfer = new DataTransfer();
			if (payload) dataTransfer.setData(BLOCK_MIME, JSON.stringify(payload));
			const bounds = host.getBoundingClientRect();
			return new DragEvent(type, {
				bubbles: true,
				cancelable: true,
				clientX: x ?? bounds.left + bounds.width / 2,
				clientY: y,
				dataTransfer
			});
		}

		function blockRects(): DOMRect[] {
			return [...host.querySelectorAll('.ProseMirror > *')].map((block) =>
				block.getBoundingClientRect()
			);
		}

		it('shows where a block would land while the learner drags over the document', () => {
			open({
				type: 'doc',
				content: [
					{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A' }] },
					...paragraph('B').content!
				]
			});
			const [first] = blockRects();

			editor.view.dom.dispatchEvent(dragEvent('dragover', first.top + 1));
			expect(editor.dropAt).toBeDefined();

			editor.view.dom.dispatchEvent(dragEvent('dragleave', 0));
			expect(editor.dropAt).toBeUndefined();
		});

		it('drops a block from the panel where the pointer is', () => {
			open({
				type: 'doc',
				content: [
					{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A' }] },
					...paragraph('B').content!
				]
			});
			const [first] = blockRects();

			editor.view.dom.dispatchEvent(
				dragEvent('drop', first.top + 1, { kind: 'artwork', artworkId: 'artwork-2' })
			);

			expect(kinds()[0]).toBe('artwork');
		});

		it('ignores a payload it does not know', () => {
			open(paragraph('B'));
			const [first] = blockRects();

			editor.view.dom.dispatchEvent(dragEvent('drop', first.bottom + 20, { kind: 'script' }));

			expect(changes).toEqual([]);
		});

		it('drops a text block of the kind that was dragged', () => {
			open(paragraph('B'));
			const [first] = blockRects();

			editor.view.dom.dispatchEvent(dragEvent('drop', first.bottom - 1, { kind: 'quote' }));

			expect(kinds()).toContain('quote');
		});

		it('moves the block that the learner picked up', () => {
			open({
				type: 'doc',
				content: [
					{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A' }] },
					...paragraph('B').content!
				]
			});
			editor.view.focus();
			expect(editor.startMove()).toBe(true);
			const [, second] = blockRects();

			editor.view.dom.dispatchEvent(dragEvent('drop', second.bottom - 1));

			expect(kinds().slice(0, 2)).toEqual(['textBlock', 'heading']);
		});
	});

	describe('the bar', () => {
		it('describes the block the cursor is in and hides when the editor loses it', () => {
			open({
				type: 'doc',
				content: [
					{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A' }] },
					...paragraph('B').content!
				]
			});

			editor.view.focus();
			editor.measure();

			expect(editor.bar).toMatchObject({ kind: 'heading', index: 0, count: 2 });

			editor.hideBar();
			expect(editor.bar).toBeUndefined();
		});

		it('turns bold and italic on for the selected text', () => {
			open(paragraph('Bold'));
			editor.view.focus();
			editor.view.dispatch(
				editor.view.state.tr.setSelection(TextSelection.create(editor.view.state.doc, 2, 6))
			);

			editor.toggle('bold');
			editor.toggle('italic');
			editor.measure();

			expect(editor.bar).toMatchObject({ bold: true, italic: true });
		});

		it('changes the note flag of the selected artwork and ignores text blocks', () => {
			open({
				type: 'doc',
				content: [
					{ type: 'artwork', attrs: { artworkId: 'artwork-1' } },
					...paragraph('B').content!
				]
			});
			editor.view.focus();

			editor.setArtwork({ note: true });
			expect(changes.at(-1)?.content?.[0].attrs?.note).toBe(true);
			expect(editor.selectedArtwork).toBe(true);

			const { state } = editor.view;
			editor.view.dispatch(state.tr.setSelection(TextSelection.atEnd(state.doc)));
			editor.setArtwork({ note: false });
			expect(changes.at(-1)?.content?.[0].attrs?.note).toBe(true);
		});
	});

	describe('an artwork block', () => {
		it('is selected by a click on the image and shows its note when asked to', async () => {
			open({
				type: 'doc',
				content: [
					{ type: 'artwork', attrs: { artworkId: 'artwork-1' } },
					...paragraph('B').content!
				]
			});

			host.querySelector<HTMLElement>('.mat')?.click();
			expect(editor.selectedArtwork).toBe(true);
			await vi.waitFor(() => expect(host.querySelector('.selected')).not.toBeNull());

			editor.setArtwork({ note: true });
			await vi.waitFor(() => expect(host.querySelector('.note')).not.toBeNull());

			editor.view.dispatch(
				editor.view.state.tr.setSelection(TextSelection.atEnd(editor.view.state.doc))
			);
			await vi.waitFor(() => expect(host.querySelector('.selected')).toBeNull());
		});

		it('keeps the caption the learner types', () => {
			open({
				type: 'doc',
				content: [
					{
						type: 'artwork',
						attrs: { artworkId: 'artwork-1' },
						content: [{ type: 'text', text: 'Candle light' }]
					},
					...paragraph('B').content!
				]
			});

			expect(host.querySelector('figcaption')?.textContent).toBe('Candle light');
		});
	});
});
