import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testAlbum } from '#lib/testing/albums/albums.ts';
import AlbumCard from './AlbumCard.svelte';

describe('AlbumCard', () => {
	it('links the album by its title with its counts and how many the atelier holds', async () => {
		render(AlbumCard, { listed: { album: testAlbum(), owned: 1 } });

		await expect
			.element(page.getByRole('link', { name: 'Paleolithic Venuses' }))
			.toHaveAttribute('href', '/atelier/albums/sample-album');
		await expect.element(page.getByText('3 dzieła')).toBeInTheDocument();
		await expect.element(page.getByText(m.albums.owned(1, 3))).toBeInTheDocument();
		expect(document.querySelectorAll('.cell')).toHaveLength(4);
		expect(document.querySelectorAll('.cell:empty')).toHaveLength(1);
	});

	it('says nothing about the atelier when it holds none of the album', async () => {
		render(AlbumCard, { listed: { album: testAlbum(), owned: 0 } });

		await expect
			.element(page.getByRole('link', { name: 'Paleolithic Venuses' }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.albums.owned(0, 3))).not.toBeInTheDocument();
	});
});
