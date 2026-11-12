import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { expectImageCredit } from '#lib/testing/image-credit/image-credit.ts';
import ReviewArtwork from './ReviewArtwork.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const image = { src: '/image.jpg', width: 400, height: 500 };

describe('ReviewArtwork', () => {
	it('shows the image with its credit and opens it in full', async () => {
		render(ReviewArtwork, { alt: 'Dzieło', image, credit: 'Wikimedia Commons' });

		await expectImageCredit('Wikimedia Commons');
		await expect
			.element(page.getByRole('button', { name: m.artworkView.openImage }))
			.toBeInTheDocument();
	});

	it('shrinks to a strip when collapsed', async () => {
		render(ReviewArtwork, { alt: 'Dzieło', image, collapsed: true, compact: true });

		await expect.element(page.getByRole('figure')).toHaveClass('collapsed');
	});

	it('shows an empty window for an artwork without an image', async () => {
		render(ReviewArtwork, { alt: 'Dzieło', artwork: testArtwork(1, 'Bez obrazu') });

		await expect
			.element(page.getByRole('button', { name: m.artworkView.openImage }))
			.not.toBeInTheDocument();
	});
});
