import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { saveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { ExhibitionSession } from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';
import ExhibitionEditorPane from './ExhibitionEditorPane.svelte';

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
vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	saveExhibition: vi.fn()
}));

function session(title = 'Light'): ExhibitionSession {
	return new ExhibitionSession({
		id: 'x',
		title,
		revision: 1,
		updatedAt: '2026-11-01T10:00:00Z',
		document: {
			type: 'doc',
			content: [
				{
					type: 'textBlock',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Soft glow' }] }]
				}
			]
		}
	});
}

describe('ExhibitionEditorPane', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(saveExhibition).mockResolvedValue({ revision: 2 });
	});

	it('shows the title and the text of the exhibition for editing', async () => {
		const lookup = new ArtworkLookup();
		render(ExhibitionEditorPane, { session: session(), lookup, barHeight: 80 });

		await expect
			.element(page.getByRole('textbox', { name: m.exhibitions.view.titleLabel }))
			.toHaveValue('Light');
		await expect.element(page.getByText('Soft glow')).toBeInTheDocument();
	});

	it('passes a new title on to the session', async () => {
		const given = session();
		render(ExhibitionEditorPane, { session: given, lookup: new ArtworkLookup(), barHeight: 80 });

		await userEvent.fill(
			page.getByRole('textbox', { name: m.exhibitions.view.titleLabel }),
			'Dark'
		);

		expect(given.title).toBe('Dark');
		expect(given.status).toBe('saving');
	});

	it('adds an artwork block when the page asks for one', async () => {
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(1, 'Judith')]);
		const { component } = await render(ExhibitionEditorPane, {
			session: session(),
			lookup,
			barHeight: 80
		});

		component.add({ kind: 'artwork', artworkId: 'artwork-1' });

		await expect.element(page.getByRole('figure')).toBeInTheDocument();
	});

	it('warns when the exhibition changed elsewhere', async () => {
		const given = session();
		vi.mocked(saveExhibition).mockResolvedValue({ conflict: true });
		render(ExhibitionEditorPane, { session: given, lookup: new ArtworkLookup(), barHeight: 80 });

		given.rename('Dark');
		await given.flush();

		await expect.element(page.getByText(m.exhibitions.save.conflict)).toBeInTheDocument();
	});

	it('shows the bar of the block the cursor is in and changes the kind of it', async () => {
		const given = session();
		await render(ExhibitionEditorPane, {
			session: given,
			lookup: new ArtworkLookup(),
			barHeight: 80
		});

		await userEvent.click(page.getByText('Soft glow'));
		await expect.element(page.getByRole('toolbar')).toBeVisible();
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.quote }));

		await vi.waitFor(() => expect(given.document.content?.[0].type).toBe('quote'));
	});

	it('tells the learner when the exhibition is full', async () => {
		const full = new ExhibitionSession({
			id: 'x',
			title: 'Full',
			revision: 1,
			updatedAt: '2026-11-01T10:00:00Z',
			document: {
				type: 'doc',
				content: Array.from({ length: 300 }, () => ({
					type: 'quote',
					content: [{ type: 'paragraph' }]
				}))
			}
		});
		const { component } = await render(ExhibitionEditorPane, {
			session: full,
			lookup: new ArtworkLookup(),
			barHeight: 80
		});

		component.add({ kind: 'textBlock' });

		await expect.element(page.getByText(m.exhibitions.limits.blocks)).toBeInTheDocument();
	});

	describe('dragging', () => {
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

		function twoTexts(): ExhibitionSession {
			return new ExhibitionSession({
				id: 'x',
				title: 'Light',
				revision: 1,
				updatedAt: '2026-11-01T10:00:00Z',
				document: {
					type: 'doc',
					content: ['Alpha', 'Beta'].map((text) => ({
						type: 'textBlock',
						content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
					}))
				}
			});
		}

		function texts(given: ExhibitionSession): string[] {
			return (given.document.content ?? []).map((block) =>
				JSON.stringify(block).includes('Alpha')
					? 'Alpha'
					: JSON.stringify(block).includes('Beta')
						? 'Beta'
						: '-'
			);
		}

		it('moves a block by the handle of its bar and shows where it lands on the way', async () => {
			const given = twoTexts();
			render(ExhibitionEditorPane, { session: given, lookup: new ArtworkLookup(), barHeight: 80 });
			await userEvent.click(page.getByText('Alpha'));
			const handle = document.querySelector('.handle');
			if (!handle) throw new Error('no handle');
			const start = handle.getBoundingClientRect();
			const beta = page.getByText('Beta').element().getBoundingClientRect();
			const x = beta.left + beta.width / 2;

			pointer('pointerdown', handle, start.left + 2, start.top + 2);
			pointer('pointermove', window, start.left + 40, start.top + 40);
			await expect.element(page.getByText('Alpha', { exact: true }).last()).toBeInTheDocument();
			expect(document.querySelector('.ghost')?.textContent).toContain('Alpha');
			expect(document.querySelector('.frame.dragging')).not.toBeNull();
			const moved = page.getByText('Beta').element().getBoundingClientRect();
			pointer('pointermove', window, x, moved.bottom - 1);
			await vi.waitFor(() => expect(document.querySelector('.drop')).not.toBeNull());
			pointer('pointerup', window, x, moved.bottom - 1);

			await vi.waitFor(() => expect(texts(given).slice(0, 2)).toEqual(['Beta', 'Alpha']));
			expect(document.querySelector('.ghost')).toBeNull();
			expect(document.querySelector('.drop')).toBeNull();
		});

		it('puts nothing down when the learner presses Escape', async () => {
			const given = twoTexts();
			render(ExhibitionEditorPane, { session: given, lookup: new ArtworkLookup(), barHeight: 80 });
			await userEvent.click(page.getByText('Alpha'));
			const handle = document.querySelector('.handle');
			if (!handle) throw new Error('no handle');
			const start = handle.getBoundingClientRect();

			pointer('pointerdown', handle, start.left, start.top);
			pointer('pointermove', window, start.left + 30, start.top + 300);
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
			pointer('pointerup', window, start.left + 30, start.top + 300);

			await vi.waitFor(() => expect(document.querySelector('.ghost')).toBeNull());
			expect(texts(given).slice(0, 2)).toEqual(['Alpha', 'Beta']);
		});

		it('drops a block brought from the panel', async () => {
			const lookup = new ArtworkLookup();
			lookup.add([testArtwork(1, 'Judith')]);
			const given = twoTexts();
			const { component } = await render(ExhibitionEditorPane, {
				session: given,
				lookup,
				barHeight: 80
			});
			const button = document.createElement('button');
			document.body.appendChild(button);
			const alpha = page.getByText('Alpha').element().getBoundingClientRect();
			const x = alpha.left + alpha.width / 2;

			button.addEventListener('pointerdown', (event) =>
				component.dragNew(event, { kind: 'artwork', artworkId: 'artwork-1' })
			);
			pointer('pointerdown', button, 0, 0);
			pointer('pointermove', window, x, alpha.top + 1);
			await vi.waitFor(() =>
				expect(document.querySelector('.ghost')?.textContent).toContain('Judith')
			);
			pointer('pointerup', window, x, alpha.top + 1);

			await vi.waitFor(() => expect(given.document.content?.[0].type).toBe('artwork'));
			button.remove();
		});

		it('picks an artwork up by its image', async () => {
			const lookup = new ArtworkLookup();
			lookup.add([testArtwork(1, 'Judith')]);
			const given = twoTexts();
			const { component } = await render(ExhibitionEditorPane, {
				session: given,
				lookup,
				barHeight: 80
			});
			component.add({ kind: 'artwork', artworkId: 'artwork-1' });
			await expect.element(page.getByRole('figure')).toBeInTheDocument();
			const mat = document.querySelector('.artwork-block .mat');
			if (!mat) throw new Error('no image');
			const start = mat.getBoundingClientRect();

			pointer('pointerdown', mat, start.left + 5, start.top + 5);
			pointer('pointermove', window, start.left + 30, start.top + 30);

			await vi.waitFor(() =>
				expect(document.querySelector('.ghost')?.textContent).toContain('Judith')
			);
			expect(document.querySelector('.artwork-block.moving')).not.toBeNull();
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
			await vi.waitFor(() => expect(document.querySelector('.moving')).toBeNull());
		});

		it('ignores a press outside of an image', async () => {
			render(ExhibitionEditorPane, {
				session: twoTexts(),
				lookup: new ArtworkLookup(),
				barHeight: 80
			});
			const text = page.getByText('Alpha').element();
			const start = text.getBoundingClientRect();

			pointer('pointerdown', text, start.left, start.top);
			pointer('pointermove', window, start.left + 40, start.top + 40);

			expect(document.querySelector('.ghost')).toBeNull();
		});
	});
});
