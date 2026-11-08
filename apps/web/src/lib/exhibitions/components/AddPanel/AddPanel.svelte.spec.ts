import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import {
	loadRecentArtworks,
	searchArtworks
} from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import AddPanel from './AddPanel.svelte';

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
	loadRecentArtworks: vi.fn(),
	searchArtworks: vi.fn(),
	loadArtworkNotes: vi.fn()
}));

const recent = vi.mocked(loadRecentArtworks);
const search = vi.mocked(searchArtworks);

const judith = testArtwork(1, 'Judith');
const olympia = testArtwork(2, 'Olympia');

describe('AddPanel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		recent.mockResolvedValue({ artworks: [judith] });
	});

	it('offers the kinds of text and adds one on a click', async () => {
		const onadd = vi.fn();
		render(AddPanel, { open: true, lookup: new ArtworkLookup(), onadd });

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.panel.quote }));

		expect(onadd).toHaveBeenCalledWith({ kind: 'quote' });
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.panel.divider }));
		expect(onadd).toHaveBeenCalledWith({ kind: 'divider' });
	});

	it('adds a term of the glossary on a click', async () => {
		const onadd = vi.fn();
		render(AddPanel, {
			open: true,
			lookup: new ArtworkLookup(),
			onadd,
			terms: [
				{
					id: 't1',
					name: 'Sfumato',
					category: 'technique',
					synonyms: [],
					forms: [],
					hasDefinition: false
				}
			]
		});

		await userEvent.click(page.getByRole('button', { name: 'Sfumato' }));

		expect(onadd).toHaveBeenCalledWith({ kind: 'term', termId: 't1', name: 'Sfumato' });
	});

	it('lists the artworks added last and adds one on a click', async () => {
		const onadd = vi.fn();
		render(AddPanel, { open: true, lookup: new ArtworkLookup(), onadd });

		await expect.element(page.getByText(m.exhibitions.panel.recent)).toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: 'Judith' }));

		expect(onadd).toHaveBeenCalledWith({ kind: 'artwork', artworkId: judith.id });
	});

	it('adds the palette or a detail of an artwork when the learner picks it first', async () => {
		const onadd = vi.fn();
		const ondrag = vi.fn();
		render(AddPanel, { open: true, lookup: new ArtworkLookup(), onadd, ondrag });

		await userEvent.click(page.getByRole('radio', { name: m.exhibitions.blocks.palette }));
		await userEvent.click(page.getByRole('button', { name: 'Judith' }));
		await userEvent.click(page.getByRole('radio', { name: m.exhibitions.blocks.closeUp }));
		await userEvent.click(page.getByRole('button', { name: 'Judith' }));

		expect(onadd).toHaveBeenNthCalledWith(1, { kind: 'palette', artworkId: judith.id });
		expect(onadd).toHaveBeenNthCalledWith(2, { kind: 'closeUp', artworkId: judith.id });
		expect(ondrag).toHaveBeenLastCalledWith(expect.any(PointerEvent), {
			kind: 'closeUp',
			artworkId: judith.id
		});
	});

	it('searches by what the learner types and says when nothing matches', async () => {
		search.mockResolvedValueOnce({ artworks: [olympia] }).mockResolvedValueOnce({ artworks: [] });
		render(AddPanel, { open: true, lookup: new ArtworkLookup(), onadd: vi.fn() });

		await userEvent.fill(page.getByRole('searchbox'), 'oly');
		await expect.element(page.getByRole('button', { name: 'Olympia' })).toBeInTheDocument();
		await expect.element(page.getByText(m.exhibitions.panel.found(1))).toBeInTheDocument();

		await userEvent.fill(page.getByRole('searchbox'), 'zzz');
		await expect.element(page.getByText(m.exhibitions.panel.noMatch)).toBeInTheDocument();
	});

	it('tells when the artworks could not be loaded', async () => {
		recent.mockResolvedValue({ artworks: [], error: m.common.network });
		render(AddPanel, { open: true, lookup: new ArtworkLookup(), onadd: vi.fn() });

		await expect.element(page.getByText(m.exhibitions.panel.loadError)).toBeInTheDocument();
	});

	it('links to the form of a new artwork when the address is given', async () => {
		render(AddPanel, {
			open: true,
			lookup: new ArtworkLookup(),
			onadd: vi.fn(),
			addHref: '/atelier/new?return=x' as never
		});

		await expect
			.element(page.getByRole('link', { name: m.exhibitions.panel.addMissing }))
			.toHaveAttribute('href', '/atelier/new?return=x');
	});
});
