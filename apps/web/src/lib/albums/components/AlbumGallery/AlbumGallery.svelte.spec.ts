import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testAlbum } from '#lib/testing/albums/albums.ts';
import AlbumGallery from './AlbumGallery.svelte';
import type { AtelierMatch } from '#lib/albums/types/atelier-match.ts';

const owned: AtelierMatch = {
	id: 'a1',
	number: 3,
	title: 'My Venus',
	albumEntry: 'sample-album/venus',
	wikidataIds: []
};
const similar: AtelierMatch = {
	id: 'a2',
	number: 7,
	title: 'lion man',
	albumEntry: null,
	wikidataIds: []
};

describe('AlbumGallery', () => {
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	it('ticks every artwork the atelier does not hold and counts them in the bar', async () => {
		render(AlbumGallery, { album: testAlbum(), matches: [owned, similar], onadd: vi.fn() });

		await expect.element(page.getByRole('checkbox', { name: /Lion Man/ })).toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: /Vogelherd Horse/ })).toBeChecked();
		await expect
			.element(page.getByRole('checkbox', { name: /Venus of Willendorf/ }))
			.not.toBeInTheDocument();
		await expect.element(page.getByText(m.albums.inAtelier('#0003'))).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.albums.compare }))
			.toHaveAttribute('href', '/atelier/compare?left=3&album=sample-album%2Fvenus');
		await expect
			.element(page.getByRole('link', { name: m.albums.similar('#0007') }))
			.toHaveAttribute('href', '/atelier/compare?left=7&album=sample-album%2Flion');
		await expect.element(page.getByText(m.albums.selected(2, 3))).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.albums.add(2) })).toBeEnabled();
	});

	it('hands the ticked entries over and counts again after a tick', async () => {
		const onadd = vi.fn();
		render(AlbumGallery, { album: testAlbum(), matches: [owned], onadd });

		await page.getByText('Lion Man').click();
		await expect.element(page.getByText(m.albums.selected(1, 3))).toBeInTheDocument();
		await page.getByRole('button', { name: m.albums.add(1) }).click();

		expect(onadd).toHaveBeenCalledWith(['horse']);
	});

	it('shows the message of the last walk through the album', async () => {
		render(AlbumGallery, {
			album: testAlbum(),
			matches: [],
			message: 'Gotowe, z albumu „Paleolithic Venuses” dodano 2 dzieła.',
			onadd: vi.fn()
		});

		await expect
			.element(page.getByText('Gotowe, z albumu „Paleolithic Venuses” dodano 2 dzieła.'))
			.toBeVisible();
	});

	it('unticks and ticks again all the artworks it shows', async () => {
		render(AlbumGallery, { album: testAlbum(), matches: [], onadd: vi.fn() });

		await page.getByRole('button', { name: m.albums.deselectAll }).click();
		await expect.element(page.getByText(m.albums.selected(0, 3))).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.albums.add(0) })).toBeDisabled();

		await page.getByRole('button', { name: m.albums.selectAll }).click();
		await expect.element(page.getByText(m.albums.selected(3, 3))).toBeInTheDocument();
	});

	it('searches the titles, alternative titles and authors', async () => {
		render(AlbumGallery, { album: testAlbum(), matches: [], onadd: vi.fn() });

		await page.getByRole('searchbox', { name: m.albums.search }).fill('ivory');
		await expect
			.element(page.getByRole('checkbox', { name: /Vogelherd Horse/ }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('checkbox', { name: /Lion Man/ })).not.toBeInTheDocument();

		await page.getByRole('searchbox', { name: m.albums.search }).fill('carver');
		await expect
			.element(page.getByRole('checkbox', { name: /Venus of Willendorf/ }))
			.toBeInTheDocument();

		await page.getByRole('searchbox', { name: m.albums.search }).fill('xyz');
		await expect.element(page.getByText(m.albums.noResults('xyz'))).toBeInTheDocument();
	});

	it('waits for the form of the next step before it lets the learner add', async () => {
		render(AlbumGallery, { album: testAlbum(), matches: [] });

		await expect.element(page.getByRole('button', { name: m.albums.add(3) })).toBeDisabled();
	});

	it('shows the album description and counts, and an error of the atelier check', async () => {
		render(AlbumGallery, { album: testAlbum(), matches: [], error: m.collectionErrors.network });

		await expect.element(page.getByText(testAlbum().description)).toBeInTheDocument();
		await expect
			.element(page.getByText(m.albums.counts(3, 0, 0), { exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.collectionErrors.network)).toBeInTheDocument();
	});

	it('lays the artworks in two columns on a phone', async () => {
		await page.viewport(390, 844);
		render(AlbumGallery, { album: testAlbum(), matches: [] });

		await expect.element(page.getByRole('checkbox', { name: /Lion Man/ })).toBeInTheDocument();
		expect(document.querySelectorAll('.column')).toHaveLength(2);
	});
});
