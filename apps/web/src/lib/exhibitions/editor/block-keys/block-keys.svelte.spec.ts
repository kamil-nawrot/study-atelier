import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TextSelection } from '@tiptap/pm/state';
import { EditorHarness, doc, heading, textBlock } from '#lib/testing/exhibitions/exhibitions.ts';
import type { ExhibitionEditor } from '#lib/exhibitions/editor/exhibition-editor/exhibition-editor.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

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

describe('block keys', () => {
	it('starts a text block under a heading when the learner presses Enter in it', () => {
		open(doc(heading('Light'), textBlock('x')));
		harness.placeCursor(0);

		expect(harness.press('Enter')).toBe(true);

		expect(harness.kinds().slice(0, 3)).toEqual(['heading', 'textBlock', 'textBlock']);
	});

	it('lets Enter make a new paragraph inside a text block', () => {
		const opened = open(doc(textBlock('One')));
		harness.placeCursor(0);

		harness.press('Enter');

		expect(opened.view.state.doc.child(0).childCount).toBe(2);
	});

	it('removes an empty block on Backspace', () => {
		open(doc(textBlock('One'), { type: 'quote', content: [{ type: 'paragraph' }] }));
		harness.placeCursor(1);

		expect(harness.press('Backspace')).toBe(true);

		expect(harness.kinds()).not.toContain('quote');
	});

	it('never joins a block to the one above on Backspace', () => {
		const opened = open(doc(textBlock('One'), heading('Two')));
		const before = JSON.stringify(opened.view.state.doc.toJSON());
		harness.placeCursor(1);

		harness.press('Backspace');

		expect(JSON.stringify(opened.view.state.doc.toJSON())).toBe(before);
	});

	it('keeps an empty text block waiting at the end of the document', () => {
		const opened = open(doc(textBlock('One')));
		opened.add({ kind: 'artwork', artworkId: 'artwork-1' });

		expect(harness.kinds().at(-1)).toBe('textBlock');
		expect(opened.view.state.doc.lastChild?.textContent).toBe('');
	});

	it('hints at the body in the empty last block and at the title in a heading', () => {
		open(doc(heading(''), textBlock('')));

		const hints = [...harness.host.querySelectorAll('[data-placeholder]')].map((element) =>
			element.getAttribute('data-placeholder')
		);
		expect(hints).toHaveLength(2);
	});

	it('keeps a selection from reaching into the next block', () => {
		const opened = open(doc(textBlock('One'), textBlock('Two')));
		const { state } = opened.view;
		opened.view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, 2, 10)));

		const { selection } = opened.view.state;
		expect(selection.$anchor.before(1)).toBe(selection.$head.before(1));
	});
});
