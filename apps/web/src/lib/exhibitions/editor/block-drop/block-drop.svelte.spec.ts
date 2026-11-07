import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorHarness, doc, textBlock } from '#lib/testing/exhibitions/exhibitions.ts';
import type { ExhibitionEditor } from '#lib/exhibitions/editor/exhibition-editor/exhibition-editor.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import { dropTarget } from './block-drop.ts';

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

describe('dropTarget', () => {
	function layout(): { first: DOMRect; second: DOMRect } {
		const blocks = [...harness.host.querySelectorAll('.ProseMirror > *')];
		return {
			first: blocks[0].getBoundingClientRect(),
			second: blocks[1].getBoundingClientRect()
		};
	}

	it('drops above a block when the pointer is in its upper half', () => {
		const opened = open(doc(textBlock('One'), textBlock('Two')));
		const { second } = layout();

		const target = dropTarget(opened.view, second.top + 1);

		expect(target?.replaces).toBe(false);
		expect(target?.from).toBe(opened.view.state.doc.child(0).nodeSize);
		expect(target?.from).toBe(target?.to);
	});

	it('drops below a block when the pointer is in its lower half', () => {
		const opened = open(doc(textBlock('One'), textBlock('Two')));
		const { first } = layout();

		const target = dropTarget(opened.view, first.bottom - 1);

		expect(target?.from).toBe(opened.view.state.doc.child(0).nodeSize);
	});

	it('takes the place of an empty block', () => {
		const opened = open(doc(textBlock('One'), textBlock('')));
		const { second } = layout();

		const target = dropTarget(opened.view, second.top + 1);

		expect(target?.replaces).toBe(true);
		expect(target?.to).toBeGreaterThan(target?.from ?? 0);
	});

	it('finds the nearest block for a pointer outside the document', () => {
		const opened = open(doc(textBlock('One'), textBlock('Two')));

		expect(dropTarget(opened.view, -500)?.from).toBe(0);
	});
});
