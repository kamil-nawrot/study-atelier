import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { loadRecentArtworks } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import ArtworkSearch from './ArtworkSearch.svelte';

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
	loadArtworksWithNotes: vi.fn().mockResolvedValue({ ids: new Set() }),
	loadRecentArtworks: vi.fn(),
	searchArtworks: vi.fn(),
	loadArtworkNotes: vi.fn()
}));

const judith = testArtwork(1, 'Judith');

describe('ArtworkSearch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadRecentArtworks).mockResolvedValue({ artworks: [judith] });
	});

	it('lists the artworks added last and passes the one picked or dragged on', async () => {
		const onpick = vi.fn();
		const ondrag = vi.fn();
		render(ArtworkSearch, { lookup: new ArtworkLookup(), onpick, ondrag });

		await expect.element(page.getByText(m.exhibitions.panel.recent)).toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: 'Judith' }));

		expect(onpick).toHaveBeenCalledWith(judith.id);
		expect(ondrag).toHaveBeenCalledWith(expect.any(PointerEvent), judith.id);
	});
});
