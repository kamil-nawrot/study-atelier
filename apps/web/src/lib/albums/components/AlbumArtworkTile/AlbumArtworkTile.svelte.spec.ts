import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { albumArtwork } from '#lib/testing/albums/albums.ts';
import AlbumArtworkTile from './AlbumArtworkTile.svelte';

const artwork = albumArtwork('lion', { title: 'Lion Man' });

describe('AlbumArtworkTile', () => {
	it('ticks a new artwork with a click and names the author as unknown when it has none', async () => {
		const ontoggle = vi.fn();
		render(AlbumArtworkTile, {
			slug: 'sample-album',
			artwork,
			authors: [],
			date: 'ok. 40 000 p.n.e.',
			state: { kind: 'new' },
			checked: true,
			ontoggle
		});

		const box = page.getByRole('checkbox', { name: /Lion Man/ });
		await expect.element(box).toBeChecked();
		await expect.element(page.getByText(m.ui.unknownAuthor)).toBeInTheDocument();
		await page.getByText('Lion Man').click();

		expect(ontoggle).toHaveBeenCalledOnce();
	});

	it('cannot tick an artwork already in the atelier and links it to the comparison', async () => {
		render(AlbumArtworkTile, {
			slug: 'sample-album',
			artwork,
			authors: ['Carver'],
			state: { kind: 'owned', number: 3 },
			checked: false,
			ontoggle: vi.fn()
		});

		await expect.element(page.getByText(m.albums.inAtelier('#0003'))).toBeInTheDocument();
		await expect.element(page.getByRole('checkbox')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.albums.compare }))
			.toHaveAttribute('href', '/atelier/compare?left=3&album=sample-album%2Flion');
	});

	it('keeps a similar artwork tickable with a line under the tile', async () => {
		render(AlbumArtworkTile, {
			slug: 'sample-album',
			artwork,
			authors: ['Carver'],
			date: '1900',
			state: { kind: 'similar', number: 7 },
			checked: true,
			ontoggle: vi.fn(),
			compact: true
		});

		await expect.element(page.getByRole('checkbox', { name: /Lion Man/ })).toBeChecked();
		await expect.element(page.getByText('Carver')).toBeInTheDocument();
		await expect.element(page.getByText('1900')).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.albums.similar('#0007') }))
			.toHaveAttribute('href', '/atelier/compare?left=7&album=sample-album%2Flion');
	});
});
