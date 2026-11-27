import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, invalidateAll } from '$app/navigation';
import { loadItemData } from '#lib/albums/album-items-data/album-items-data.ts';
import { albumVersion } from '#lib/albums/album-version/album-version.ts';
import { loadArtworkVersion } from '#lib/albums/album-version-load/album-version-load.ts';
import { saveGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import { albumWithItems, testAlbum } from '#lib/testing/albums/albums.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import { answerNothingFromWikidata } from '#lib/testing/add-artwork/add-artwork.ts';
import type { Album } from '#lib/albums/types/album.ts';
import AddPage from './+page.svelte';

vi.mock('#lib/artworks/form-suggestions/form-suggestions.svelte.ts', async () => ({
	FormSuggestions: (await import('#lib/testing/form-suggestions/form-suggestions.ts'))
		.FakeFormSuggestions
}));
vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
vi.mock('#lib/albums/album-version-load/album-version-load.ts', () => ({
	loadArtworkVersion: vi.fn()
}));
vi.mock('#lib/albums/album-items-data/album-items-data.ts', () => ({ loadItemData: vi.fn() }));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ saveGlossaryEntry: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { getSession: vi.fn(), signOut: vi.fn() }, from: vi.fn(), rpc: vi.fn() }
}));

const ALBUM_PATH = '/atelier/albums/sample-album';

function renderPage(album: Album): void {
	render(AddPage, {
		data: {
			session: testSession(),
			album,
			artworks: album.artworks.slice(0, 1),
			ownFields: undefined
		},
		params: { slug: album.slug }
	});
}

async function toChoice(): Promise<void> {
	await page.getByRole('link', { name: m.albums.walk.finish }).click();
	await expect.element(page.getByText(m.albums.closing.title)).toBeVisible();
}

describe('album add page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		answerNothingFromWikidata();
		autoFetch.definition = false;
		autoFetch.forms = false;
		autoFetch.image = false;
		vi.mocked(loadArtworkVersion).mockImplementation(async (album, artwork) => ({
			version: albumVersion(album, artwork, [])
		}));
		vi.mocked(loadItemData).mockResolvedValue({
			matches: { entries: [], events: [], records: [], details: {} },
			entries: [],
			index: testCardIndex()
		});
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ id: 'a-new' });
		await page.viewport(1280, 800);
	});

	it('finishes straight away when the album has nothing but artworks', async () => {
		renderPage(testAlbum());

		await page.getByRole('link', { name: m.albums.walk.finish }).click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith(ALBUM_PATH, {
				refreshAll: true,
				state: { albumMessage: m.albums.walk.done('Paleolithic Venuses', 0) }
			})
		);
		expect(loadItemData).not.toHaveBeenCalled();
	});

	it('lets the learner skip every other item', async () => {
		renderPage(albumWithItems());
		await toChoice();

		await page.getByRole('button', { name: m.albums.closing.skipAll }).click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith(ALBUM_PATH, {
				refreshAll: true,
				state: { albumMessage: m.albums.walk.done('Paleolithic Venuses', 0) }
			})
		);
	});

	it('walks through the ticked items and reports how many were added', async () => {
		renderPage(albumWithItems());
		await toChoice();
		await page.getByText('Unrelated', { exact: true }).click();
		await page.getByRole('button', { name: m.albums.closing.add(1) }).click();
		await expect.element(page.getByText(m.albums.closing.progress(1, 1))).toBeVisible();
		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Unrelated');

		await page.getByRole('button', { name: m.albums.walk.saveAndFinish }).click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith(ALBUM_PATH, {
				refreshAll: true,
				state: { albumMessage: m.albums.closing.done('Paleolithic Venuses', 0, 1) }
			})
		);
	});

	it('ends the items early and moves to the next step in between', async () => {
		renderPage(albumWithItems());
		await toChoice();
		await page.getByText('Unrelated', { exact: true }).click();
		await page.getByText('Carving', { exact: true }).click();
		await page.getByRole('button', { name: m.albums.closing.add(2) }).click();

		await page.getByRole('button', { name: m.albums.walk.skip }).click();
		await expect.element(page.getByText(m.albums.closing.progress(2, 2))).toBeVisible();
		expect(invalidateAll).toHaveBeenCalled();
		await page.getByRole('link', { name: m.albums.walk.finish }).click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
	});

	it('shows the failure when the album cannot be opened', async () => {
		render(AddPage, {
			data: { session: testSession(), artworks: [], ownFields: undefined, notFound: true },
			params: { slug: 'missing' }
		});

		await expect.element(page.getByText(m.albums.notFound)).toBeVisible();
	});
});
