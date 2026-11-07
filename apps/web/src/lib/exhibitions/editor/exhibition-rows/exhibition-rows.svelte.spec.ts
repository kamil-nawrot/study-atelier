import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	EditorHarness,
	artwork,
	closeUp,
	columns,
	doc,
	heading,
	textBlock
} from '#lib/testing/exhibitions/exhibitions.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import type { NewBlock } from '#lib/exhibitions/editor/block-commands/block-commands.ts';

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
vi.mock('#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts', () => ({
	loadArtworkImages: vi.fn().mockResolvedValue({ images: new Map() })
}));

const harness = new EditorHarness();
let style: HTMLStyleElement;

beforeEach(() => {
	harness.setup();
	style = document.createElement('style');
	style.textContent = `
		.ProseMirror [data-block="columns"] { display: flex; gap: 8px; }
		.ProseMirror [data-column] { flex: 1; min-width: 0; }
		.ProseMirror p { margin: 0; min-height: 20px; }
	`;
	document.head.appendChild(style);
});

afterEach(() => {
	harness.teardown();
	style.remove();
});

function shape(node: ExhibitionDocument | undefined): string {
	if (!node) return '';
	if (node.type === 'textBlock') {
		return `text:${(node.content ?? []).map((child) => child.content?.[0]?.text ?? '').join('/')}`;
	}
	if (node.type === 'heading') return `heading:${node.content?.[0]?.text ?? ''}`;
	if (node.type === 'artwork') return `artwork:${String(node.attrs?.artworkId)}`;
	if (node.type === 'closeUp') return `closeUp:${String(node.attrs?.artworkId)}`;
	if (node.type === 'quote') return 'quote';
	return `${node.type}(${(node.content ?? []).map(shape).join(' ')})`;
}

function outline(): string {
	return (harness.changes.at(-1)?.content ?? []).map(shape).join(' | ');
}

function blockEl(label: string): HTMLElement {
	const found = [
		...harness.host.querySelectorAll<HTMLElement>('.ProseMirror [data-block], .ProseMirror h2')
	]
		.filter((element) => element.closest('[data-block="columns"]') !== element)
		.find((element) => element.textContent?.includes(label) || element.dataset.artworkId === label);
	if (!found) throw new Error(`no block ${label}`);
	return found;
}

function drop(label: string, side: 'left' | 'right' | 'middle', payload?: NewBlock): void {
	const rect = blockEl(label).getBoundingClientRect();
	const x =
		side === 'left'
			? rect.left + 2
			: side === 'right'
				? rect.right - 2
				: rect.left + rect.width / 2;
	harness.opened().place(payload, x, rect.top + rect.height / 2);
}

function select(text: string): void {
	const { view } = harness.opened();
	let found: number | undefined;
	view.state.doc.descendants((node, pos) => {
		if (found === undefined && node.isTextblock && node.textContent.includes(text)) found = pos + 1;
		return found === undefined;
	});
	if (found === undefined) throw new Error(`no text ${text}`);
	view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, found)));
}

function selectArtwork(id: string): void {
	const { view } = harness.opened();
	let found: number | undefined;
	view.state.doc.descendants((node, pos) => {
		if (found === undefined && node.attrs.artworkId === id) found = pos;
		return found === undefined;
	});
	if (found === undefined) throw new Error(`no artwork ${id}`);
	view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, found)));
}

describe('rows of blocks', () => {
	it('forms a row when a block is dropped at the left side of another one', () => {
		harness.open(doc(textBlock('Alpha'), textBlock('')));

		drop('Alpha', 'left', { kind: 'artwork', artworkId: 'artwork-1' });

		expect(outline()).toContain('columns(column(artwork:artwork-1) column(text:Alpha))');
	});

	it('forms a row when a block is dropped at the right side of another one', () => {
		harness.open(doc(textBlock('Alpha'), textBlock('')));

		drop('Alpha', 'right', { kind: 'quote' });

		expect(outline()).toMatch(/^columns\(column\(text:Alpha\) column\(quote/);
	});

	it('adds a third column beside a row of two', () => {
		harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));

		drop('Beta', 'right', { kind: 'artwork', artworkId: 'artwork-2' });

		expect(outline()).toMatch(
			/^columns\(column\(text:Alpha\) column\(text:Beta\) column\(artwork:artwork-2\)\)/
		);
	});

	it('adds a column in the middle when the drop is at the left side of an inner block', () => {
		harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));

		drop('Beta', 'left', { kind: 'artwork', artworkId: 'artwork-2' });

		expect(outline()).toMatch(
			/^columns\(column\(text:Alpha\) column\(artwork:artwork-2\) column\(text:Beta\)\)/
		);
	});

	it('does not open a fourth column', () => {
		harness.open(
			doc(columns(textBlock('Alpha'), textBlock('Beta'), textBlock('Gamma')), textBlock(''))
		);
		const before = harness.changes.length;

		drop('Gamma', 'right', { kind: 'artwork', artworkId: 'artwork-2' });

		expect(harness.changes.length).toBe(before);
	});

	it('says that a row of three is full while the learner drags over it', () => {
		const opened = harness.open(
			doc(columns(textBlock('Alpha'), textBlock('Beta'), textBlock('Gamma')), textBlock(''))
		);
		const rect = blockEl('Gamma').getBoundingClientRect();

		opened.hover(rect.right - 2, rect.top + rect.height / 2);

		expect(opened.dropAt?.full).toBe(true);
		expect(opened.dropAt?.side).toBe('right');
	});

	it('shows an empty place at the side of a block while the learner drags over it', () => {
		const opened = harness.open(doc(textBlock('Alpha'), textBlock('')));
		const rect = blockEl('Alpha').getBoundingClientRect();

		opened.hover(rect.left + 2, rect.top + 4);

		expect(opened.dropAt?.side).toBe('left');
		expect(opened.dropAt?.full).toBe(false);
		expect(opened.dropAt?.width).toBeLessThan(rect.width);
	});

	it('drops above or below a row when the pointer is in the middle of it', () => {
		const opened = harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));
		const rect = blockEl('Alpha').getBoundingClientRect();
		const x = rect.left + rect.width / 2;

		opened.place({ kind: 'artwork', artworkId: 'artwork-1' }, x, rect.top + 1);

		expect(outline()).toMatch(/^artwork:artwork-1 \| columns/);
	});

	it('moves a block beside another one and leaves its old place', () => {
		const opened = harness.open(doc(textBlock('Alpha'), heading('Beta'), textBlock('')));
		select('Alpha');
		expect(opened.startMove()).toBeDefined();

		drop('Beta', 'right');

		expect(outline()).toMatch(/^columns\(column\(heading:Beta\) column\(text:Alpha\)\)/);
	});

	it('moves a block out of a row of two and dissolves the row', () => {
		const opened = harness.open(
			doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('Gamma'), textBlock(''))
		);
		select('Alpha');
		expect(opened.startMove()).toBeDefined();

		drop('Gamma', 'middle');

		expect(outline()).toMatch(/^text:Beta \| (text:Gamma \| text:Alpha|text:Alpha \| text:Gamma)/);
	});

	it('moves a block to the other side of its own row', () => {
		const opened = harness.open(
			doc(columns(textBlock('Alpha'), textBlock('Beta'), textBlock('Gamma')), textBlock(''))
		);
		select('Gamma');
		opened.startMove();

		drop('Alpha', 'left');

		expect(outline()).toMatch(
			/^columns\(column\(text:Gamma\) column\(text:Alpha\) column\(text:Beta\)\)/
		);
	});

	it('does not move a block beside itself', () => {
		const opened = harness.open(doc(textBlock('Alpha'), textBlock('')));
		select('Alpha');
		opened.startMove();
		const before = harness.changes.length;

		drop('Alpha', 'left');

		expect(harness.changes.length).toBe(before);
	});

	it('moves the block between columns with the arrows', () => {
		const opened = harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));
		select('Alpha');

		opened.step(1);
		expect(outline()).toMatch(/^columns\(column\(text:Beta\) column\(text:Alpha\)\)/);
		select('Alpha');
		opened.step(-1);
		expect(outline()).toMatch(/^columns\(column\(text:Alpha\) column\(text:Beta\)\)/);
	});

	it('does not move a block past the edge of its row', () => {
		const opened = harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));
		select('Alpha');
		const before = harness.changes.length;

		opened.step(-1);

		expect(harness.changes.length).toBe(before);
	});

	it('reports a block of a row to the bar with the position among the columns', () => {
		const opened = harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));
		opened.view.focus();
		select('Beta');
		opened.measure();

		expect(opened.bar).toMatchObject({ kind: 'textBlock', row: true, index: 1, count: 2 });
	});

	it('dissolves a row when one block is left', () => {
		const opened = harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));
		select('Alpha');

		opened.remove();

		expect(outline()).toMatch(/^text:Beta \| text:/);
	});

	it('removes the block of a row with Backspace when it is empty', () => {
		harness.open(doc(columns(textBlock(''), textBlock('Beta')), textBlock('')));
		harness.opened().view.focus();
		const { view } = harness.opened();
		view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 4)));

		harness.press('Backspace');

		expect(outline()).toMatch(/^text:Beta/);
	});

	it('keeps a row of three when one block goes and two are left', () => {
		const opened = harness.open(
			doc(columns(textBlock('Alpha'), textBlock('Beta'), textBlock('Gamma')), textBlock(''))
		);
		select('Beta');

		opened.remove();

		expect(outline()).toMatch(/^columns\(column\(text:Alpha\) column\(text:Gamma\)\)/);
	});

	it('turns a block of a row into another kind in place', () => {
		const opened = harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));
		select('Beta');

		opened.convert('heading');

		expect(outline()).toMatch(/^columns\(column\(text:Alpha\) column\(heading:Beta\)\)/);
	});

	it('adds a paragraph below a row when Enter leaves a heading of the row', () => {
		harness.open(doc(columns(heading('Alpha'), textBlock('Beta')), textBlock('Tail')));
		select('Alpha');
		harness.opened().view.focus();

		harness.press('Enter');

		expect(outline()).toMatch(/^columns\([^|]*\) \| text: \| text:Tail/);
	});

	it('keeps a selection of text inside one block of a row', () => {
		const opened = harness.open(doc(columns(textBlock('Alpha'), textBlock('Beta')), textBlock('')));
		const { view } = opened;
		let alpha = 0;
		let beta = 0;
		view.state.doc.descendants((node, pos) => {
			if (node.isTextblock && node.textContent === 'Alpha') alpha = pos + 1;
			if (node.isTextblock && node.textContent === 'Beta') beta = pos + 3;
			return true;
		});

		view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, alpha, beta)));

		const { selection } = view.state;
		expect(selection.$anchor.sameParent(selection.$head)).toBe(true);
	});
});

describe('close-ups in the editor', () => {
	const attributes = { artworkId: 'artwork-1', imageId: null, x: 0.4, y: 0.6, viewWidth: 0.3 };

	it('puts a close-up in a row beside the artwork', () => {
		const opened = harness.open(doc(artwork('artwork-1'), textBlock('')));
		selectArtwork('artwork-1');

		opened.addCloseUp(attributes);

		expect(outline()).toMatch(
			/^columns\(column\(artwork:artwork-1\) column\(closeUp:artwork-1\)\)/
		);
	});

	it('adds a close-up as a third column of a row of two', () => {
		const opened = harness.open(
			doc(columns(artwork('artwork-1'), textBlock('Beta')), textBlock(''))
		);
		selectArtwork('artwork-1');

		opened.addCloseUp(attributes);

		expect(outline()).toMatch(
			/^columns\(column\(artwork:artwork-1\) column\(closeUp:artwork-1\) column\(text:Beta\)\)/
		);
	});

	it('puts a close-up below a row that is full', () => {
		const opened = harness.open(
			doc(columns(artwork('artwork-1'), textBlock('Beta'), textBlock('Gamma')), textBlock(''))
		);
		selectArtwork('artwork-1');

		opened.addCloseUp(attributes);

		expect(outline()).toMatch(/^columns\([^|]*\) \| closeUp:artwork-1/);
	});

	it('puts a close-up after the cursor when there is none', () => {
		const opened = harness.open(doc(textBlock('Alpha'), textBlock('')));

		opened.addCloseUp(attributes);

		expect(outline()).toContain('closeUp:artwork-1');
	});

	it('refuses a close-up when the exhibition holds the most blocks', () => {
		const many = Array.from({ length: 300 }, () => textBlock('x'));
		const opened = harness.open(doc(...many));

		opened.addCloseUp(attributes);

		expect(harness.limits).toHaveLength(1);
	});

	it('moves a close-up with the arrows like any block', () => {
		const opened = harness.open(
			doc(columns(closeUp('artwork-1'), textBlock('Beta')), textBlock(''))
		);
		selectArtwork('artwork-1');

		opened.step(1);

		expect(outline()).toMatch(/^columns\(column\(text:Beta\) column\(closeUp:artwork-1\)\)/);
	});

	it('leaves the exhibition with a close-up reachable from the bar', () => {
		const opened = harness.open(doc(closeUp('artwork-1'), textBlock('')));
		opened.view.focus();
		selectArtwork('artwork-1');
		opened.measure();

		expect(opened.bar).toMatchObject({ kind: 'closeUp', row: false });
	});
});
