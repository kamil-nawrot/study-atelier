import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { albumVersion } from '#lib/albums/album-version/album-version.ts';
import { AlbumWalk } from '#lib/albums/album-walk/album-walk.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testAlbum } from '#lib/testing/albums/albums.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { answerRpc, saveArtworkCalls, waitForSave } from '#lib/testing/duplicates/duplicates.ts';
import { answerNothingFromWikidata } from '#lib/testing/add-artwork/add-artwork.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import AlbumWalkForm from './AlbumWalkForm.svelte';

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
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	loadAtelier: vi.fn(),
	resolveImages: vi.fn(),
	refreshExpiredImages: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: {
		auth: { getSession: vi.fn(), signOut: vi.fn() },
		from: vi.fn(),
		rpc: vi.fn(),
		storage: { from: vi.fn() }
	}
}));

const rpcCall = { single: vi.fn() };

function openedWalk(entryIds: string[]): AlbumWalk {
	const album = testAlbum();
	const artworks = album.artworks.filter((artwork) => entryIds.includes(artwork.id));
	const walk = new AlbumWalk(album, artworks);
	const [artwork] = artworks;
	walk.version = albumVersion(album, artwork, []);
	return walk;
}

function renderForm(walk: AlbumWalk, handlers: Record<string, () => void> = {}): void {
	render(AlbumWalkForm, {
		walk,
		cancelHref: '/atelier/albums/sample-album',
		onfinish: vi.fn(),
		onsaved: vi.fn(),
		oncompleted: vi.fn(),
		onskip: vi.fn(),
		...handlers
	});
}

describe('AlbumWalkForm', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		answerNothingFromWikidata();
		answerRpc(rpcCall);
		rpcCall.single.mockResolvedValue({ data: { id: 'artwork-1', record_number: 1 }, error: null });
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: testSession() },
			error: null
		});
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('prefills the form from the album and marks the values that are new', async () => {
		renderForm(openedWalk(['venus', 'lion']));

		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.title }))
			.toHaveValue('Venus of Willendorf');
		await expect.element(page.getByText('Unknown Carver nowa wartość')).toBeVisible();
	});

	it('offers finishing, skipping and saving on to the next artwork', async () => {
		renderForm(openedWalk(['venus', 'lion']));

		await expect.element(page.getByRole('link', { name: m.albums.walk.finish })).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.albums.walk.skip })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.albums.walk.saveAndNext }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.saveAndNext }))
			.not.toBeInTheDocument();
	});

	it('says "Zapisz i zakończ" under the last artwork', async () => {
		renderForm(openedWalk(['venus']));

		await expect
			.element(page.getByRole('button', { name: m.albums.walk.saveAndFinish }))
			.toBeVisible();
	});

	it('saves the artwork with its album entry and revision and reports it', async () => {
		const onsaved = vi.fn();
		renderForm(openedWalk(['venus', 'lion']), { onsaved });

		await page.getByRole('button', { name: m.albums.walk.saveAndNext }).click();
		await waitForSave();

		const [, payload] = saveArtworkCalls()[0] as [string, { artwork: Record<string, unknown> }];
		expect(payload.artwork).toMatchObject({
			title: 'Venus of Willendorf',
			album_entry: 'sample-album/venus',
			album_revision: 1
		});
		await expect.poll(() => onsaved.mock.calls.length).toBe(1);
	});

	it('hands over the skip without saving', async () => {
		const onskip = vi.fn();
		renderForm(openedWalk(['venus', 'lion']), { onskip });

		await page.getByRole('button', { name: m.albums.walk.skip }).click();

		expect(onskip).toHaveBeenCalledOnce();
		expect(saveArtworkCalls()).toHaveLength(0);
	});

	it('ends the artworks from "Zakończ" when nothing was changed', async () => {
		const onfinish = vi.fn();
		renderForm(openedWalk(['venus', 'lion']), { onfinish });

		await page.getByRole('link', { name: m.albums.walk.finish }).click();

		await expect.poll(() => onfinish.mock.calls.length).toBe(1);
	});

	it('shows the error when the album version cannot be loaded', async () => {
		const walk = openedWalk(['venus']);
		walk.version = undefined;
		walk.error = 'Network down';
		renderForm(walk);

		await expect.element(page.getByText('Network down')).toBeVisible();
	});

	it('shows that the artwork is loading', async () => {
		const walk = openedWalk(['venus']);
		walk.version = undefined;
		renderForm(walk);

		await expect.element(page.getByText(m.albums.walk.loading)).toBeVisible();
	});

	it('compares a similar artwork with the album version and switches to the form for another artwork', async () => {
		const walk = openedWalk(['venus', 'lion']);
		walk.mine = {
			...emptyArtworkInput(),
			id: 'artwork-7',
			number: 7,
			favourite: false,
			title: 'Venus of Willendorf',
			relations: []
		} as ArtworkRecord;
		renderForm(walk);

		await expect.element(page.getByText(m.albums.walk.similar('#0007'))).toBeVisible();
		await expect.element(page.getByText(m.compare.album).first()).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.albums.walk.saveAndNext }))
			.toBeEnabled();

		await page.getByRole('button', { name: m.albums.walk.addAsNew }).click();

		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.title }))
			.toHaveValue('Venus of Willendorf');
		await expect.element(page.getByText(m.albums.walk.similar('#0007'))).not.toBeInTheDocument();
	});

	it('opens the picker of the atelier from "Mam je już w atelier" and goes back to the form', async () => {
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [] });
		const walk = openedWalk(['venus', 'lion']);
		renderForm(walk);

		await page.getByRole('button', { name: m.albums.walk.inAtelier }).click();

		await expect
			.element(page.getByRole('heading', { name: new RegExp(m.albums.walk.pickLead) }))
			.toBeVisible();
		expect(walk.picking).toBe(true);

		await page.getByRole('button', { name: m.albums.walk.backToForm }).click();

		await expect.element(page.getByRole('textbox', { name: m.artworkForm.title })).toBeVisible();
	});

	it('names the picked artwork in the comparison', async () => {
		const walk = openedWalk(['venus', 'lion']);
		vi.spyOn(walk, 'chosen', 'get').mockReturnValue(true);
		walk.mine = {
			...emptyArtworkInput(),
			id: 'artwork-9',
			number: 9,
			favourite: false,
			title: 'Venus',
			relations: []
		} as ArtworkRecord;
		renderForm(walk);

		await expect.element(page.getByText(m.albums.walk.chosen('#0009'))).toBeVisible();
		await expect.element(page.getByText(m.albums.walk.similar('#0009'))).not.toBeInTheDocument();
	});
});
