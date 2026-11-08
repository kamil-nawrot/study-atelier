import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { loadRecentArtworks } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import ArtworkPickDialog from './ArtworkPickDialog.svelte';

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

describe('ArtworkPickDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadRecentArtworks).mockResolvedValue({ artworks: [judith] });
	});

	it('passes the picked artwork on and closes', async () => {
		const onpick = vi.fn();
		render(ArtworkPickDialog, {
			open: true,
			title: m.exhibitions.paletteDialog.title,
			lookup: new ArtworkLookup(),
			onpick
		});

		const dialog = page.getByRole('dialog', { name: m.exhibitions.paletteDialog.title });
		await userEvent.click(dialog.getByRole('button', { name: 'Judith' }));

		expect(onpick).toHaveBeenCalledWith(judith.id);
		await expect.element(dialog).not.toBeInTheDocument();
	});

	it('adds nothing when the learner cancels', async () => {
		const onpick = vi.fn();
		render(ArtworkPickDialog, {
			open: true,
			title: m.exhibitions.paletteDialog.title,
			lookup: new ArtworkLookup(),
			onpick
		});

		await userEvent.click(page.getByRole('button', { name: m.common.cancel }));

		expect(onpick).not.toHaveBeenCalled();
	});
});
