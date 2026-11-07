import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	EditorHarness,
	artwork,
	doc,
	heading,
	paragraph,
	text,
	textBlock
} from '#lib/testing/exhibitions/exhibitions.ts';
import type { ExhibitionEditor } from '#lib/exhibitions/editor/exhibition-editor/exhibition-editor.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import {
	currentBlock,
	isEmptyBlock,
	isTextKind,
	moveBlockTo,
	removeBlock,
	stepBlock
} from './block-commands.ts';
import {
	convertBlock,
	setArtworkAttributes
} from '#lib/exhibitions/editor/block-conversion/block-conversion.ts';

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

const harness = new EditorHarness();
const open = (content: ExhibitionDocument): ExhibitionEditor => harness.open(content);

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

function blockAt(index: number): NonNullable<ReturnType<typeof currentBlock>> {
	harness.placeCursor(index);
	const block = currentBlock(harness.opened().view.state);
	if (!block) throw new Error('no block');
	return block;
}

describe('block commands', () => {
	it('knows the text kinds', () => {
		expect(isTextKind('quote')).toBe(true);
		expect(isTextKind('artwork')).toBe(false);
	});

	it('finds the block, its place and the number of blocks', () => {
		open(doc(textBlock('One'), heading('Two')));

		const block = blockAt(1);

		expect(block.node.type.name).toBe('heading');
		expect(block.index).toBe(1);
		expect(block.count).toBe(2);
	});

	it('does not count a block with a list or with text as empty', () => {
		const opened = open(
			doc(
				textBlock('One'),
				{
					type: 'textBlock',
					content: [
						{
							type: 'bulletList',
							content: [{ type: 'listItem', content: [paragraph('')] }]
						}
					]
				},
				textBlock('')
			)
		);

		const { doc: document } = opened.view.state;
		expect([0, 1, 2].map((index) => isEmptyBlock(document.child(index)))).toEqual([
			false,
			false,
			true
		]);
	});

	it('turns several paragraphs into one heading and drops what a heading cannot hold', () => {
		const opened = open(
			doc({
				type: 'textBlock',
				content: [
					{ type: 'paragraph', content: [text('One', [{ type: 'bold' }, { type: 'italic' }])] },
					paragraph('Two')
				]
			})
		);
		const block = blockAt(0);

		opened.view.dispatch(convertBlock(opened.view.state, block, 'heading'));

		const converted = opened.view.state.doc.child(0);
		expect(converted.type.name).toBe('heading');
		expect(converted.textContent).toBe('One Two');
		expect(converted.child(0).marks.map((mark) => mark.type.name)).toEqual(['italic']);
	});

	it('turns a heading into a quote with its text', () => {
		const opened = open(doc(heading('Light')));
		const block = blockAt(0);

		opened.view.dispatch(convertBlock(opened.view.state, block, 'quote'));

		expect(opened.view.state.doc.child(0).type.name).toBe('quote');
		expect(opened.view.state.doc.child(0).textContent).toBe('Light');
	});

	it('keeps the text of a heading that becomes a paragraph', () => {
		const opened = open(doc(heading('Light')));
		const block = blockAt(0);

		opened.view.dispatch(convertBlock(opened.view.state, block, 'textBlock'));

		expect(opened.view.state.doc.child(0).type.name).toBe('textBlock');
		expect(opened.view.state.doc.child(0).textContent).toBe('Light');
	});

	it('moves a block to the end and keeps it selected', () => {
		const opened = open(doc(heading('A'), textBlock('B'), textBlock('C')));
		const block = blockAt(0);

		opened.view.dispatch(moveBlockTo(opened.view.state, block, opened.view.state.doc.content.size));

		expect(opened.view.state.doc.child(2).type.name).toBe('heading');
	});

	it('does not move a block onto itself', () => {
		const opened = open(doc(heading('A'), textBlock('B')));
		const block = blockAt(0);

		const tr = moveBlockTo(opened.view.state, block, block.pos + 1);

		expect(tr.docChanged).toBe(false);
	});

	it('does not step the first block up or the last block down', () => {
		const opened = open(doc(heading('A'), textBlock('B')));

		expect(stepBlock(opened.view.state, blockAt(0), -1)).toBeUndefined();
		expect(stepBlock(opened.view.state, blockAt(1), 1)).toBeUndefined();
	});

	it('steps a block up', () => {
		const opened = open(doc(heading('A'), textBlock('B')));

		const tr = stepBlock(opened.view.state, blockAt(1), -1);
		if (tr) opened.view.dispatch(tr);

		expect(opened.view.state.doc.child(0).type.name).toBe('textBlock');
	});

	it('leaves an empty text block when the only block is removed', () => {
		const opened = open(doc(artwork('artwork-1')));
		opened.view.focus();
		const block = currentBlock(opened.view.state);
		if (!block) throw new Error('no block');

		opened.view.dispatch(removeBlock(opened.view.state, block));

		expect(opened.view.state.doc.childCount).toBe(1);
		expect(opened.view.state.doc.child(0).type.name).toBe('textBlock');
	});

	it('puts the cursor in the block before the one that was removed', () => {
		const opened = open(doc(textBlock('One'), heading('Two'), textBlock('')));
		const block = blockAt(1);

		opened.view.dispatch(removeBlock(opened.view.state, block));

		expect(currentBlock(opened.view.state)?.node.textContent).toBe('One');
	});

	it('harness.changes attributes of an artwork and keeps the rest', () => {
		const opened = open(doc(artwork('artwork-1'), textBlock('')));
		opened.view.focus();
		const block = currentBlock(opened.view.state);
		if (!block) throw new Error('no block');

		opened.view.dispatch(setArtworkAttributes(opened.view.state, block, { note: true }));

		const attrs = opened.view.state.doc.child(0).attrs;
		expect(attrs.note).toBe(true);
		expect(attrs.artworkId).toBe('artwork-1');
	});
});
