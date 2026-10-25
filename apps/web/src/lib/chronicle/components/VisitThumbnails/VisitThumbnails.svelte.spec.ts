import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import VisitThumbnails from './VisitThumbnails.svelte';

describe('VisitThumbnails', () => {
	it('shows each artwork by its title and author and says how many more there are', async () => {
		render(VisitThumbnails, {
			artworks: [testArtwork(1, 'Water Lilies', { authors: ['Claude Monet'] })],
			more: 3
		});

		await expect
			.element(page.getByRole('img', { name: 'Water Lilies, Claude Monet' }))
			.toBeVisible();
		await expect.element(page.getByText(m.chronicle.moreLabel(3))).toBeInTheDocument();
	});

	it('shows the empty window for an artwork without an image and no count when all fit', async () => {
		render(VisitThumbnails, {
			artworks: [testArtwork(2, 'Sketch', { hasImage: false, image: undefined })],
			more: 0
		});

		await expect.element(page.getByRole('img', { name: m.ui.noImage })).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.more(1))).not.toBeInTheDocument();
	});
});
