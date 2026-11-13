import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { searchRelatedArtworks } from '#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts';
import type { RelatedArtwork } from '#lib/artwork-relations/types/related-artwork.ts';
import RelatedArtworkSearch from './RelatedArtworkSearch.svelte';

vi.mock('#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts', () => ({
	searchRelatedArtworks: vi.fn()
}));

const kiss = { id: 'kiss', number: 7, title: 'The Kiss', authors: ['Gustav Klimt'] };
const otherKiss = { id: 'kiss-2', number: 8, title: 'The Kiss', authors: ['Auguste Rodin'] };
const self = { id: 'self', number: 1, title: 'The Self', authors: [] };

function search(artwork: RelatedArtwork | null = null): { artwork: () => RelatedArtwork | null } {
	const props = $state({ artwork, excluded: new Set(['self']) });
	render(RelatedArtworkSearch, props);
	return { artwork: () => props.artwork };
}

describe('RelatedArtworkSearch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(searchRelatedArtworks).mockResolvedValue({ artworks: [kiss, otherKiss, self] });
	});

	it('lists the found artworks with their authors, without the excluded ones, and keeps the picked one as a tag', async () => {
		const { artwork } = search();

		await userEvent.fill(page.getByRole('combobox', { name: m.artworkRelations.search }), 'the');
		await expect.element(page.getByRole('option', { name: /Auguste Rodin/ })).toBeVisible();
		expect(searchRelatedArtworks).toHaveBeenCalledWith('the', expect.any(AbortSignal));
		expect(page.getByRole('option', { name: /The Self/ }).query()).toBeNull();
		await userEvent.click(page.getByRole('option', { name: /Auguste Rodin/ }));

		expect(artwork()).toEqual({ id: 'kiss-2', number: 8, title: 'The Kiss' });
		await expect.element(page.getByText('The Kiss', { exact: true })).toBeVisible();
	});

	it('clears the artwork when its tag is removed', async () => {
		const { artwork } = search({ id: 'kiss', number: 7, title: 'The Kiss' });

		await userEvent.click(page.getByRole('button', { name: /The Kiss/ }));

		expect(artwork()).toBeNull();
		await expect
			.element(page.getByRole('combobox', { name: m.artworkRelations.search }))
			.toBeVisible();
	});

	it('says when no artwork matches', async () => {
		vi.mocked(searchRelatedArtworks).mockResolvedValue({ artworks: [] });
		search();

		await userEvent.fill(page.getByRole('combobox', { name: m.artworkRelations.search }), 'xyz');

		await expect.element(page.getByText(m.artworkRelations.noMatch)).toBeInTheDocument();
	});
});
