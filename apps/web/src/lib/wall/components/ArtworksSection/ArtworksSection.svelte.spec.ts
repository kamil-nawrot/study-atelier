import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import ArtworksSection from './ArtworksSection.svelte';

const images = { failed: vi.fn(), request: vi.fn() } as unknown as WallImages;

describe('ArtworksSection', () => {
	it('counts the artworks in its heading', async () => {
		render(ArtworksSection, {
			title: 'Dzieła tego autora',
			empty: 'Brak dzieł.',
			artworks: [testArtwork(1, 'Mona Lisa'), testArtwork(2, 'Annunciation')],
			images
		});

		await expect
			.element(page.getByRole('region', { name: 'Dzieła tego autora' }).getByRole('heading'))
			.toHaveTextContent(/Dzieła tego autora\s*2/);
		await expect.element(page.getByText('Brak dzieł.')).not.toBeInTheDocument();
	});

	it('says when there are no artworks and collapses', async () => {
		render(ArtworksSection, {
			title: 'Dzieła tego autora',
			empty: 'Brak dzieł.',
			artworks: [],
			images
		});

		await expect.element(page.getByText('Brak dzieł.')).toBeVisible();
		await page.getByText('Dzieła tego autora').click();
		await expect.element(page.getByText('Brak dzieł.')).not.toBeVisible();
	});
});
