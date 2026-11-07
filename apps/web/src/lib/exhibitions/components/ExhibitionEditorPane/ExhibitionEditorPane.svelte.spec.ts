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

	it('picks up the block by its handle', async () => {
		await render(ExhibitionEditorPane, {
			session: session(),
			lookup: new ArtworkLookup(),
			barHeight: 80
		});
		await userEvent.click(page.getByText('Soft glow'));
		const handle = document.querySelector('.handle');
		const event = new DragEvent('dragstart', {
			bubbles: true,
			cancelable: true,
			dataTransfer: new DataTransfer()
		});

		handle?.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
		expect(event.dataTransfer?.types).toContain('application/x-exhibition-block');
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

	it('shows where a dragged block would land', async () => {
		await render(ExhibitionEditorPane, {
			session: session(),
			lookup: new ArtworkLookup(),
			barHeight: 80
		});
		const block = document.querySelector('.ProseMirror > *');
		const top = block?.getBoundingClientRect().top ?? 0;

		document.querySelector('.ProseMirror')?.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				cancelable: true,
				clientY: top + 1,
				dataTransfer: new DataTransfer()
			})
		);

		await vi.waitFor(() => expect(document.querySelector('.drop')).not.toBeNull());
	});
});
