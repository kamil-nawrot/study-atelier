import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { goto } from '$app/navigation';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import { saveArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import { m } from '#lib/i18n/i18n.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import AlbumComparison from './AlbumComparison.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn(), beforeNavigate: vi.fn() }));
vi.mock('#lib/artworks/artwork-data/artwork-data.ts', () => ({ saveArtwork: vi.fn() }));
vi.mock('#lib/images/image-palette/image-palette.ts', () => ({ paletteOf: vi.fn() }));

function albumImage(name: string): ArtworkImageInput {
	return {
		kind: 'album',
		path: `venus/images/${name}.webp`,
		wikidataId: 'Q131397',
		licence: 'CC0',
		licenceUrl: null,
		attribution: 'Foto',
		width: 600,
		height: 800
	};
}

const MINE: ArtworkRecord = {
	...emptyArtworkInput(),
	id: 'artwork-3',
	number: 3,
	favourite: false,
	title: 'Wenus z Willendorfu',
	authorUnknown: true,
	yearTo: 25000,
	toBeforeCommonEra: true,
	eraCode: 'prehistory',
	materials: ['wapień'],
	location: 'Wiedeń',
	notes: 'Moja notatka.',
	relations: []
};

const VERSION: AlbumVersion = {
	slug: 'venus',
	entryId: 'willendorf',
	albumTitle: 'Wenus paleolityczne',
	revision: 2,
	wikidataId: 'Q131397',
	newValues: ['location:Naturhistorisches Museum', 'period:kultura grawecka'],
	artwork: {
		...emptyArtworkInput(),
		title: 'Wenus z Willendorfu',
		authorUnknown: true,
		yearFrom: 29500,
		fromBeforeCommonEra: true,
		yearTo: 25000,
		toBeforeCommonEra: true,
		yearApproximate: true,
		eraCode: 'prehistory',
		period: 'kultura grawecka',
		materials: ['wapień', 'ochra'],
		location: 'Naturhistorisches Museum',
		notes: 'Opis z albumu.',
		image: albumImage('front'),
		images: []
	}
};

describe('AlbumComparison', () => {
	beforeEach(() => {
		vi.mocked(goto).mockReset();
		vi.mocked(saveArtwork).mockReset();
	});

	it('starts with the own values and the album values of the empty fields picked', async () => {
		await render(AlbumComparison, { mine: MINE, version: VERSION, ownFields: [] });

		await expect.element(page.getByText(m.compare.hint)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.compare.keep('kultura grawecka') }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('button', { name: m.compare.keep('Wiedeń') }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByRole('checkbox', { name: 'ochra' })).not.toBeChecked();
		await expect
			.element(page.getByRole('group', { name: m.artworkForm.title }))
			.toHaveTextContent(m.compare.same);
		await expect.element(page.getByText(m.compare.taken('okres, 1 obraz'))).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.compare.saveChanges })).toBeEnabled();
	});

	it('moves the pick between the two values without moving them', async () => {
		await render(AlbumComparison, { mine: MINE, version: VERSION, ownFields: [] });
		const mine = page.getByRole('button', { name: m.compare.keep('Wiedeń') });
		const album = page.getByRole('button', { name: m.compare.keep('Naturhistorisches Museum') });

		await album.click();

		await expect.element(album).toHaveAttribute('aria-pressed', 'true');
		await expect.element(mine).toHaveAttribute('aria-pressed', 'false');
		await expect.element(page.getByText(m.compare.taken('okres, miejsce, 1 obraz'))).toBeVisible();
		await mine.click();
		await expect.element(album).toHaveAttribute('aria-pressed', 'false');
	});

	it('says what an unticked own item removes', async () => {
		await render(AlbumComparison, { mine: MINE, version: VERSION, ownFields: [] });

		await page.getByRole('checkbox', { name: 'wapień', exact: true }).click();

		await expect.element(page.getByText(m.compare.removed('wapień'))).toBeVisible();
	});

	it('saves the picked values with the album entry and its revision', async () => {
		vi.mocked(saveArtwork).mockResolvedValue({ saved: true, id: 'artwork-3', number: 3 });
		await render(AlbumComparison, { mine: MINE, version: VERSION, ownFields: [] });

		await page.getByRole('checkbox', { name: 'ochra' }).click();
		await page.getByRole('checkbox', { name: new RegExp(m.compare.appendNote) }).click();
		await page.getByRole('button', { name: m.compare.saveChanges }).click();

		await expect.poll(() => vi.mocked(goto).mock.calls.length).toBe(1);
		const [input, existing] = vi.mocked(saveArtwork).mock.calls[0];
		expect(input).toMatchObject({
			materials: ['wapień', 'ochra'],
			location: 'Wiedeń',
			period: 'kultura grawecka',
			notes: 'Moja notatka.\n\nOpis z albumu.',
			image: albumImage('front'),
			relations: undefined,
			album: { entry: 'venus/willendorf', revision: 2 }
		});
		expect(existing).toEqual({ id: 'artwork-3', image: null, images: [] });
		expect(goto).toHaveBeenCalledWith('/atelier/3', {
			replace: true,
			refreshAll: true,
			state: { saved: 3 }
		});
	});

	it('says why the changes were not saved', async () => {
		vi.mocked(saveArtwork).mockResolvedValue({
			saved: false,
			error: 'Brak sieci',
			fieldErrors: {}
		});
		await render(AlbumComparison, { mine: MINE, version: VERSION, ownFields: [] });

		await page.getByRole('button', { name: m.compare.saveChanges }).click();

		await expect.element(page.getByText('Brak sieci')).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});

	it('records a newer revision of an entry without other changes', async () => {
		await render(AlbumComparison, {
			mine: { ...MINE, album: { entry: 'venus/willendorf', revision: 1 } },
			version: VERSION,
			ownFields: []
		});

		await expect.element(page.getByRole('button', { name: m.compare.saveChanges })).toBeEnabled();
	});

	it('marks the values the atelier does not have yet', async () => {
		await render(AlbumComparison, { mine: MINE, version: VERSION, ownFields: [] });

		await expect
			.element(page.getByRole('group', { name: m.artworkForm.period }))
			.toHaveTextContent(m.compare.newValue);
	});

	it('links an artwork to the entry without changes and hands the save over inside a walk', async () => {
		vi.mocked(saveArtwork).mockResolvedValue({ saved: true, id: 'artwork-3', number: 3 });
		const onsaved = vi.fn();
		await render(AlbumComparison, {
			mine: MINE,
			version: VERSION,
			ownFields: [],
			saveLabel: m.albums.walk.saveAndNext,
			onsaved
		});

		await page.getByRole('button', { name: m.albums.walk.saveAndNext }).click();

		await expect.poll(() => onsaved.mock.calls.length).toBe(1);
		expect(vi.mocked(saveArtwork).mock.calls[0][0]).toMatchObject({
			album: { entry: 'venus/willendorf', revision: 2 }
		});
		expect(goto).not.toHaveBeenCalled();
	});
});
