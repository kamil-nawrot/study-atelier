import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { saveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { ExhibitionSession } from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';
import { artwork, columns, doc, textBlock } from '#lib/testing/exhibitions/exhibitions.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import ExhibitionEditorPane from './ExhibitionEditorPane.svelte';

const loadArtworkPins = vi.hoisted(() => vi.fn());

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
vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	saveExhibition: vi.fn()
}));
vi.mock('#lib/pins/pin-data/pin-data.ts', () => ({ loadArtworkPins }));

function session(document: ExhibitionDocument = doc(textBlock('Soft glow'))): ExhibitionSession {
	return new ExhibitionSession({
		id: 'x',
		title: 'Light',
		revision: 1,
		updatedAt: '2026-11-01T10:00:00Z',
		document
	});
}

function lookup(): ArtworkLookup {
	const given = new ArtworkLookup();
	given.add([testArtwork(1, 'Judith'), testArtwork(2, 'Olympia')]);
	return given;
}

function kinds(given: ExhibitionSession): string[] {
	return (given.document.content ?? []).map((node) =>
		node.type === 'columns'
			? `columns(${(node.content ?? []).map((column) => column.content?.[0].type).join(',')})`
			: (node.type ?? '')
	);
}

function card(index: number): HTMLElement {
	const found = document.querySelectorAll<HTMLElement>('[data-block-id]')[index];
	if (!found) throw new Error(`no block ${index}`);
	return found;
}

describe('ExhibitionEditorPane', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(saveExhibition).mockResolvedValue({ revision: 2 });
	});

	it('shows the title and every block as a card of its own', async () => {
		render(ExhibitionEditorPane, {
			session: session(doc(textBlock('Soft glow'), artwork('artwork-1'))),
			lookup: lookup(),
			barHeight: 80
		});

		await expect
			.element(page.getByRole('textbox', { name: m.exhibitions.view.titleLabel }))
			.toHaveValue('Light');
		await expect.element(page.getByText('Soft glow')).toBeInTheDocument();
		await expect
			.element(page.getByRole('toolbar', { name: m.exhibitions.bar.label('Dzieło') }))
			.toBeInTheDocument();
	});

	it('passes a new title on to the session', async () => {
		const given = session();
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 80 });

		await userEvent.fill(
			page.getByRole('textbox', { name: m.exhibitions.view.titleLabel }),
			'Dark'
		);

		expect(given.title).toBe('Dark');
	});

	it('invites the learner to add the first block of an empty exhibition', async () => {
		render(ExhibitionEditorPane, { session: session(doc()), lookup: lookup(), barHeight: 80 });

		await expect.element(page.getByText(m.exhibitions.view.emptyBody)).toBeInTheDocument();
	});

	it('leaves blank texts of the old editor out', async () => {
		const given = session(doc(textBlock(''), artwork('artwork-1'), textBlock('')));
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 80 });

		await expect.element(page.getByRole('figure')).toBeInTheDocument();
		expect(document.querySelectorAll('[data-block-id]')).toHaveLength(1);
	});

	it('keeps an artwork when the learner adds a text after it, types and removes the text', async () => {
		const given = session(doc());
		const { component } = await render(ExhibitionEditorPane, {
			session: given,
			lookup: lookup(),
			barHeight: 80
		});

		component.add({ kind: 'artwork', artworkId: 'artwork-1' });
		component.add({ kind: 'textBlock' });
		const field = page.getByRole('textbox', { name: m.exhibitions.blocks.textBlock });
		await expect.element(field).toHaveFocus();
		await userEvent.fill(field, 'Light from the left');
		await vi.waitFor(() => expect(JSON.stringify(given.document)).toContain('Light from the left'));
		expect(kinds(given)).toEqual(['artwork', 'textBlock']);

		await userEvent.fill(field, '');
		await vi.waitFor(() => expect(JSON.stringify(given.document)).not.toContain('Light'));
		await userEvent.click(
			card(1).querySelector('[aria-label="' + m.exhibitions.bar.remove + '"]')!
		);

		await vi.waitFor(() => expect(kinds(given)).toEqual(['artwork']));
		expect(given.document.content?.[0].attrs?.artworkId).toBe('artwork-1');
	});

	it('formats a text with the buttons of its bar', async () => {
		const given = session();
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 80 });

		await userEvent.tripleClick(page.getByText('Soft glow'));
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.bold }));
		await vi.waitFor(() => expect(JSON.stringify(given.document)).toContain('"bold"'));

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.italic }));
		await userEvent.click(
			page.getByRole('button', { name: m.exhibitions.bar.bulletList, exact: true })
		);
		await vi.waitFor(() => expect(JSON.stringify(given.document)).toContain('bulletList'));
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.orderedList }));
		await vi.waitFor(() => expect(JSON.stringify(given.document)).toContain('orderedList'));
		expect(JSON.stringify(given.document)).toContain('"italic"');
	});

	it('writes a heading and a quote into fields of their own', async () => {
		const given = session(doc());
		const { component } = await render(ExhibitionEditorPane, {
			session: given,
			lookup: lookup(),
			barHeight: 80
		});

		component.add({ kind: 'heading' });
		component.add({ kind: 'quote' });
		await userEvent.fill(
			page.getByRole('textbox', { name: m.exhibitions.blocks.heading }),
			'Night'
		);
		await userEvent.fill(
			page.getByRole('textbox', { name: m.exhibitions.blocks.quote }),
			'Light\nis all'
		);

		await vi.waitFor(() => expect(kinds(given)).toEqual(['heading', 'quote']));
		expect(given.document.content?.[0].content?.[0].text).toBe('Night');
		expect(given.document.content?.[1].content).toHaveLength(2);
	});

	it('adds a palette as an artwork showing only its colours', async () => {
		const given = session(doc());
		const { component } = await render(ExhibitionEditorPane, {
			session: given,
			lookup: lookup(),
			barHeight: 80
		});

		component.add({ kind: 'palette', artworkId: 'artwork-2' });

		await vi.waitFor(() =>
			expect(given.document.content?.[0].attrs).toEqual({
				artworkId: 'artwork-2',
				paletteOnly: true
			})
		);
		await expect
			.element(page.getByRole('toolbar', { name: m.exhibitions.bar.label('Paleta') }))
			.toBeInTheDocument();
	});

	it('asks for a pin before it adds a detail', async () => {
		loadArtworkPins.mockResolvedValue({ pins: [] });
		const given = session(doc());
		const { component } = await render(ExhibitionEditorPane, {
			session: given,
			lookup: lookup(),
			barHeight: 80
		});

		component.add({ kind: 'closeUp', artworkId: 'artwork-1' });

		await expect
			.element(page.getByRole('dialog', { name: m.exhibitions.closeUpDialog.title }))
			.toBeInTheDocument();
		expect(given.document.content).toEqual([]);
	});

	it('moves a block with the arrows of its bar', async () => {
		const given = session(
			doc(textBlock('Alpha'), columns(artwork('artwork-1'), textBlock('Beta')))
		);
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 80 });

		const up = (index: number): Element =>
			card(index).querySelector(`[aria-label="${m.exhibitions.bar.up}"]`)!;
		const down = (index: number): Element =>
			card(index).querySelector(`[aria-label="${m.exhibitions.bar.down}"]`)!;
		await expect.element(page.getByText('Beta')).toBeInTheDocument();
		expect(up(0)).toHaveProperty('disabled', true);

		await userEvent.click(down(2));
		await vi.waitFor(() => expect(kinds(given)).toEqual(['textBlock', 'artwork', 'textBlock']));
		await userEvent.click(down(0));
		await vi.waitFor(() => expect(kinds(given)).toEqual(['artwork', 'textBlock', 'textBlock']));
		expect(down(2)).toHaveProperty('disabled', true);
	});

	it('warns when the exhibition changed elsewhere', async () => {
		const given = session();
		vi.mocked(saveExhibition).mockResolvedValue({ conflict: true });
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 80 });

		given.rename('Dark');
		await given.flush();

		await expect.element(page.getByText(m.exhibitions.save.conflict)).toBeInTheDocument();
	});

	it('tells the learner when the exhibition is full and adds nothing', async () => {
		const given = session(
			doc(
				...Array.from({ length: 300 }, () => ({ type: 'quote', content: [{ type: 'paragraph' }] }))
			)
		);
		const { component } = await render(ExhibitionEditorPane, {
			session: given,
			lookup: lookup(),
			barHeight: 80
		});

		component.add({ kind: 'textBlock' });

		await expect.element(page.getByText(m.exhibitions.limits.blocks)).toBeInTheDocument();
		expect(given.document.content).toHaveLength(300);
	});
});

function pointer(type: string, target: EventTarget, x: number, y: number): void {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y,
			button: 0,
			pointerId: 1,
			pointerType: 'mouse'
		})
	);
}

function shape(given: ExhibitionSession): string[] {
	const name = (node: ExhibitionDocument): string =>
		node.type === 'artwork' ? 'Judith' : (JSON.stringify(node).match(/"text":"(\w+)"/)?.[1] ?? '-');
	return (given.document.content ?? []).map((node) =>
		node.type === 'columns'
			? (node.content ?? []).map((column) => name(column.content?.[0] ?? {})).join('|')
			: name(node)
	);
}

function named(name: string): HTMLElement {
	const found = [...document.querySelectorAll<HTMLElement>('[data-block-id]')].find((element) =>
		element.textContent?.includes(name)
	);
	if (!found) throw new Error(`no block ${name}`);
	return found;
}

function handle(name: string): Element {
	const found = named(name).querySelector('.handle');
	if (!found) throw new Error(`no handle in ${name}`);
	return found;
}

function grab(name: string): { x: number; y: number } {
	const box = handle(name).getBoundingClientRect();
	const at = { x: box.left + 4, y: box.top + 4 };
	pointer('pointerdown', handle(name), at.x, at.y);
	pointer('pointermove', window, at.x + 10, at.y + 10);
	return at;
}

describe('ExhibitionEditorPane dragging', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(saveExhibition).mockResolvedValue({ revision: 2 });
	});

	it('moves a block below another one and shows a line where it lands', async () => {
		const given = session(doc(textBlock('Alpha'), textBlock('Beta')));
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 0 });
		await expect.element(page.getByText('Beta')).toBeInTheDocument();

		grab('Alpha');
		await vi.waitFor(() =>
			expect(document.querySelector('.ghost')?.textContent).toContain('Tekst')
		);
		expect(named('Alpha').classList).toContain('moving');
		const beta = named('Beta').getBoundingClientRect();
		const x = beta.left + beta.width / 2;
		pointer('pointermove', window, x, beta.bottom - 2);
		await vi.waitFor(() => expect(document.querySelector('.mark:not([data-side])')).not.toBeNull());
		pointer('pointerup', window, x, beta.bottom - 2);

		await vi.waitFor(() => expect(shape(given)).toEqual(['Beta', 'Alpha']));
		expect(document.querySelector('.ghost')).toBeNull();
		expect(document.querySelector('.mark')).toBeNull();
	});

	it('splits a row into columns when a block lands on the edge of another', async () => {
		const given = session(doc(textBlock('Alpha'), artwork('artwork-1')));
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 0 });
		await expect.element(page.getByRole('figure')).toBeInTheDocument();

		grab('Alpha');
		const judith = named('Judith').getBoundingClientRect();
		const y = (judith.top + judith.bottom) / 2;
		pointer('pointermove', window, judith.right - 4, y);
		await vi.waitFor(() => expect(document.querySelector('.mark[data-side]')).not.toBeNull());
		pointer('pointerup', window, judith.right - 4, y);

		await vi.waitFor(() => expect(shape(given)).toEqual(['Judith|Alpha']));
		expect(given.document.content?.[0].type).toBe('columns');
	});

	it('keeps an image its full size while a block is dragged', async () => {
		const given = session(doc(textBlock('Alpha'), artwork('artwork-1')));
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 0 });
		await expect.element(page.getByRole('figure')).toBeInTheDocument();
		const before = named('Judith').getBoundingClientRect().height;

		grab('Alpha');

		expect(named('Judith').getBoundingClientRect().height).toBe(before);
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	});

	it('picks an artwork up by its image and puts nothing down after Escape', async () => {
		const given = session(doc(artwork('artwork-1'), textBlock('Alpha')));
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 0 });
		await expect.element(page.getByRole('figure')).toBeInTheDocument();
		const figure = named('Judith').querySelector('.grab');
		if (!figure) throw new Error('no figure');
		const box = figure.getBoundingClientRect();

		pointer('pointerdown', figure, box.left + 20, box.top + 20);
		pointer('pointermove', window, box.left + 40, box.top + 60);
		await vi.waitFor(() =>
			expect(document.querySelector('.ghost')?.textContent).toContain('Judith')
		);
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		pointer('pointerup', window, box.left + 40, box.bottom + 400);

		await vi.waitFor(() => expect(document.querySelector('.ghost')).toBeNull());
		expect(shape(given)).toEqual(['Judith', 'Alpha']);
	});

	it('puts nothing down outside the exhibition', async () => {
		const given = session(doc(textBlock('Alpha'), textBlock('Beta')));
		render(ExhibitionEditorPane, { session: given, lookup: lookup(), barHeight: 0 });
		await expect.element(page.getByText('Beta')).toBeInTheDocument();

		grab('Alpha');
		const rows = document.querySelector('.rows')?.getBoundingClientRect();
		if (!rows) throw new Error('no rows');
		pointer('pointerup', window, rows.right + 50, rows.top + 10);

		await vi.waitFor(() => expect(document.querySelector('.ghost')).toBeNull());
		expect(shape(given)).toEqual(['Alpha', 'Beta']);
	});

	it('drops a block brought from the panel where the line shows', async () => {
		const given = session(doc(textBlock('Alpha'), textBlock('Beta')));
		const { component } = await render(ExhibitionEditorPane, {
			session: given,
			lookup: lookup(),
			barHeight: 0
		});
		await expect.element(page.getByText('Beta')).toBeInTheDocument();
		const button = document.createElement('button');
		document.body.appendChild(button);
		button.addEventListener('pointerdown', (event) =>
			component.dragNew(event, { kind: 'artwork', artworkId: 'artwork-1' })
		);
		const beta = named('Beta').getBoundingClientRect();
		const x = beta.left + beta.width / 2;

		pointer('pointerdown', button, 0, 0);
		pointer('pointermove', window, x, beta.top + 2);
		await vi.waitFor(() =>
			expect(document.querySelector('.ghost')?.textContent).toContain('Dzieło: Judith')
		);
		pointer('pointerup', window, x, beta.top + 2);

		await vi.waitFor(() => expect(shape(given)).toEqual(['Alpha', 'Judith', 'Beta']));
		button.remove();
	});
});
