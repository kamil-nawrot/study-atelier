import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import ExhibitionPoster from './ExhibitionPoster.svelte';

const exhibition = {
	id: '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
	title: 'Light',
	updatedAt: '2020-03-04T10:00:00Z',
	artworkCount: 3,
	coverId: 'artwork-1'
};

describe('ExhibitionPoster', () => {
	it('links to the exhibition and shows the cover, title and number of artworks', async () => {
		const cover = testArtwork(1, 'Judith');
		render(ExhibitionPoster, { exhibition, cover });

		await expect
			.element(page.getByRole('link'))
			.toHaveAttribute('href', `/atelier/exhibitions/${exhibition.id}`);
		await expect.element(page.getByText('Light')).toBeInTheDocument();
		await expect.element(page.getByText(/3 dzieła/)).toBeInTheDocument();
		expect(document.querySelector('img')?.getAttribute('src')).toBe(cover.image?.src);
	});

	it('shows a frame without an image when there is no cover', async () => {
		render(ExhibitionPoster, { exhibition: { ...exhibition, coverId: null } });

		await expect.element(page.getByText('Light')).toBeInTheDocument();
		expect(document.querySelector('img')).toBeNull();
	});
});
