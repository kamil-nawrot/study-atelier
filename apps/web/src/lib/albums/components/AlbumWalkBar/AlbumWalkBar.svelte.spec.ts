import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { AlbumWalk } from '#lib/albums/album-walk/album-walk.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testAlbum } from '#lib/testing/albums/albums.ts';
import AlbumWalkBar from './AlbumWalkBar.svelte';

vi.mock('#lib/albums/album-version-load/album-version-load.ts', () => ({
	loadArtworkVersion: vi.fn(async () => ({}))
}));

function walkOf(): AlbumWalk {
	const album = testAlbum();
	return new AlbumWalk(album, album.artworks);
}

describe('AlbumWalkBar', () => {
	it('shows a thumbnail for every artwork and the position of the open one', async () => {
		render(AlbumWalkBar, { walk: walkOf() });

		await expect.element(page.getByRole('list', { name: m.albums.walk.listLabel })).toBeVisible();
		await expect.element(page.getByRole('listitem')).toHaveLength(3);
		await expect.element(page.getByText(m.albums.walk.progress(1, 3))).toBeVisible();
		await expect
			.element(page.getByRole('listitem').first())
			.toHaveAttribute('aria-current', 'step');
	});

	it('marks the artworks that were saved or skipped and moves the position on', async () => {
		const walk = walkOf();
		await walk.skip();
		await walk.saved();
		render(AlbumWalkBar, { walk });

		await expect.element(page.getByText(m.albums.walk.progress(3, 3))).toBeVisible();
		await expect.element(page.getByText(/Venus of Willendorf.*pominięte/)).toBeInTheDocument();
		await expect.element(page.getByText(/Lion Man.*dodane/)).toBeInTheDocument();
	});
});
