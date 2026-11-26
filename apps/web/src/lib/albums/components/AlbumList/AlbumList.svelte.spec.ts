import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testAlbum } from '#lib/testing/albums/albums.ts';
import AlbumList from './AlbumList.svelte';

const caves = { album: testAlbum({ slug: 'caves', title: 'Cave paintings' }), owned: 0 };
const rome = { album: testAlbum({ slug: 'rome', title: 'Rome', eraCode: 'antiquity' }), owned: 0 };

describe('AlbumList', () => {
	beforeEach(() => localStorage.clear());

	it('groups the albums under the eras of the curator and folds an era', async () => {
		render(AlbumList, { albums: [rome, caves] });

		const headings = page.getByRole('heading', { level: 2 });
		await expect.element(headings.nth(0)).toHaveTextContent(m.eras.prehistory.name);
		await expect.element(headings.nth(1)).toHaveTextContent(m.eras.antiquity.name);
		await expect.element(page.getByRole('link', { name: 'Rome' })).toBeInTheDocument();

		await page.getByRole('button', { name: m.eras.antiquity.name }).click();

		await expect.element(page.getByRole('link', { name: 'Rome' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Cave paintings' })).toBeInTheDocument();
	});

	it('says so when no album is listed', async () => {
		render(AlbumList, { albums: [] });

		await expect.element(page.getByText(m.albums.empty)).toBeInTheDocument();
	});
});
