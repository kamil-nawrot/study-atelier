import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { searchRelatedArtworks } from '#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts';
import RelatedArtworkSearch from './RelatedArtworkSearch.svelte';

vi.mock('#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts', () => ({
	searchRelatedArtworks: vi.fn()
}));

const kiss = { id: 'kiss', number: 7, title: 'The Kiss', authors: ['Gustav Klimt'] };
const self = { id: 'self', number: 1, title: 'The Self', authors: [] };

describe('RelatedArtworkSearch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(searchRelatedArtworks).mockResolvedValue({ artworks: [kiss, self] });
	});

	it('lists the found artworks without the excluded ones and passes the one picked on', async () => {
		const onpick = vi.fn();
		render(RelatedArtworkSearch, { excluded: new Set(['self']), onpick });

		await userEvent.fill(page.getByRole('searchbox', { name: m.artworkRelations.search }), 'the');
		await userEvent.click(page.getByRole('button', { name: /The Kiss/ }));

		expect(searchRelatedArtworks).toHaveBeenCalledWith('the', expect.any(AbortSignal));
		expect(page.getByRole('button', { name: /The Self/ }).query()).toBeNull();
		expect(onpick).toHaveBeenCalledWith({ id: 'kiss', number: 7, title: 'The Kiss' });
	});

	it('says when no artwork matches', async () => {
		vi.mocked(searchRelatedArtworks).mockResolvedValue({ artworks: [] });
		render(RelatedArtworkSearch, { excluded: new Set<string>(), onpick: vi.fn() });

		await userEvent.fill(page.getByRole('searchbox', { name: m.artworkRelations.search }), 'xyz');

		await expect.element(page.getByText(m.artworkRelations.noMatch)).toBeInTheDocument();
	});
});
