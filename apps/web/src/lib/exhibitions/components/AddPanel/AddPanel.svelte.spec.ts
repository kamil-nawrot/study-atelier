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
	});

	it('lists the artworks added last and adds one on a click', async () => {
		const onadd = vi.fn();
		render(AddPanel, { open: true, lookup: new ArtworkLookup(), onadd });

		await expect.element(page.getByText(m.exhibitions.panel.recent)).toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: 'Judith' }));

		expect(onadd).toHaveBeenCalledWith({ kind: 'artwork', artworkId: judith.id });
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
