import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IMAGES_BUCKET } from '#lib/images/bucket.ts';
import { fetchCommonsThumbnails } from '#lib/images/commons.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { SIGNED_URL_SECONDS } from '#lib/images/bucket.ts';
import {
	DEFAULT_IMAGE_SIZE,
	loadAtelier,
	loadTrash,
	refreshExpiredImages,
	resolveImages
} from './artworks.ts';
import { resolvedImages } from './resolved-images.ts';
import type { WallArtwork } from './types.ts';

vi.mock('#lib/images/commons.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/images/commons.ts')>()),
	fetchCommonsThumbnails: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({
	supabase: { from: vi.fn(), storage: { from: vi.fn() } }
}));

const query = {
	select: vi.fn(),
	is: vi.fn(),
	not: vi.fn(),
	order: vi.fn(),
	range: vi.fn()
};
const createSignedUrls = vi.fn();

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'artwork-1',
		record_number: 1,
		title: 'The Test Painting',
		year_from: null,
		year_to: 1490,
		year_approximate: true,
		era_code: null,
		source_image_file: null,
		own_image_path: null,
		own_image_url: null,
		image_width: null,
		image_height: null,
		deleted_at: null,
		artwork_values: [],
		...overrides
	};
}

function author(name: string, position: number): Record<string, unknown> {
	return { position, category_values: { category_code: 'author', name } };
}

function period(name: string, position: number): Record<string, unknown> {
	return { position, category_values: { category_code: 'period', name } };
}

async function loadResolved(): Promise<WallArtwork[]> {
	const { artworks } = await loadAtelier();
	const resolved = new Map((await resolveImages(artworks)).map((artwork) => [artwork.id, artwork]));
	return artworks.map((artwork) => resolved.get(artwork.id) ?? artwork);
}

describe('loadAtelier', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resolvedImages.clear();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrls } as never);
		query.select.mockReturnValue(query);
		query.is.mockReturnValue(query);
		query.order.mockReturnValue(query);
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map());
	});

	it('asks for artworks outside the trash, newest first', async () => {
		query.range.mockResolvedValue({ data: [], error: null });

		await expect(loadAtelier()).resolves.toEqual({ artworks: [] });
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.select).toHaveBeenCalledWith(expect.stringContaining('image_width, image_height'));
		expect(query.is).toHaveBeenCalledWith('deleted_at', null);
		expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
		expect(query.order).toHaveBeenCalledWith('id', { ascending: false });
		expect(query.range).toHaveBeenCalledWith(0, 999);
	});

	it('keeps asking for the next 1000 artworks until a page is not full', async () => {
		const page = (from: number, count: number): Record<string, unknown>[] =>
			Array.from({ length: count }, (_, index) =>
				row({ id: `artwork-${from + index}`, record_number: from + index })
			);
		query.range
			.mockResolvedValueOnce({ data: page(0, 1000), error: null })
			.mockResolvedValueOnce({ data: page(1000, 250), error: null });

		const { artworks } = await loadAtelier();

		expect(artworks).toHaveLength(1250);
		expect(artworks[1249].id).toBe('artwork-1249');
		expect(query.range).toHaveBeenNthCalledWith(1, 0, 999);
		expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
		expect(query.range).toHaveBeenCalledTimes(2);
	});

	it('asks once more after exactly 1000 artworks and stops at an empty page', async () => {
		query.range
			.mockResolvedValueOnce({
				data: Array.from({ length: 1000 }, (_, index) => row({ id: `artwork-${index}` })),
				error: null
			})
			.mockResolvedValueOnce({ data: [], error: null });

		const { artworks } = await loadAtelier();

		expect(artworks).toHaveLength(1000);
		expect(query.range).toHaveBeenCalledTimes(2);
	});

	it('returns no artworks and a message when a later page fails', async () => {
		query.range
			.mockResolvedValueOnce({
				data: Array.from({ length: 1000 }, (_, index) => row({ id: `artwork-${index}` })),
				error: null
			})
			.mockResolvedValueOnce({
				data: null,
				error: { code: '', message: 'TypeError: Failed to fetch' }
			});

		await expect(loadAtelier()).resolves.toEqual({
			artworks: [],
			error: m.collectionErrors.network
		});
	});

	it('lists authors in their order, keeps the era, formats the date and keeps the year', async () => {
		query.range.mockResolvedValue({
			data: [
				row({
					era_code: 'early_modern',
					artwork_values: [
						author('Second Author', 1),
						period('Mannerism', 1),
						{ position: 0, category_values: { category_code: 'style', name: 'Baroque' } },
						period('Renaissance', 0),
						author('First Author', 0)
					]
				})
			],
			error: null
		});

		const { artworks } = await loadAtelier();

		expect(artworks).toEqual([
			{
				id: 'artwork-1',
				number: 1,
				title: 'The Test Painting',
				authors: ['First Author', 'Second Author'],
				date: m.atelier.year(1490, true),
				yearFrom: null,
				yearTo: 1490,
				eraCode: 'early_modern',
				image: undefined
			}
		]);
	});

	it('formats a year span and keeps both of its years', async () => {
		query.range.mockResolvedValue({
			data: [row({ year_from: -50, year_to: 20, year_approximate: false })],
			error: null
		});

		const { artworks } = await loadAtelier();

		expect(artworks[0].date).toBe(m.atelier.span(-50, 20, false));
		expect(artworks[0].yearFrom).toBe(-50);
		expect(artworks[0].yearTo).toBe(20);
	});

	it('returns the artworks without waiting for any image and keeps what is needed to find it later', async () => {
		query.range.mockResolvedValue({
			data: [
				row({ source_image_file: 'Test.jpg', image_width: 1000, image_height: 750 }),
				row({ id: 'artwork-2', record_number: 2, own_image_path: 'user-id/artwork-2/image.jpg' }),
				row({ id: 'artwork-3', record_number: 3 })
			],
			error: null
		});

		const { artworks } = await loadAtelier();

		expect(fetchCommonsThumbnails).not.toHaveBeenCalled();
		expect(createSignedUrls).not.toHaveBeenCalled();
		expect(artworks[0].image).toEqual({ width: 1000, height: 750 });
		expect(artworks[0].pendingImage).toEqual({
			sourceFile: 'Test.jpg',
			size: { width: 1000, height: 750 }
		});
		expect(artworks[1].image).toEqual(DEFAULT_IMAGE_SIZE);
		expect(artworks[1].pendingImage).toEqual({ ownPath: 'user-id/artwork-2/image.jpg' });
		expect(artworks[2].pendingImage).toBeUndefined();
	});

	it('uses the stored size and the thumbnail from Commons for a Commons image', async () => {
		const thumbnailUrl = 'https://upload.wikimedia.org/thumb/a/ab/Test.jpg/500px-Test.jpg';
		query.range.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', image_width: 1000, image_height: 750 })],
			error: null
		});
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map([['Test.jpg', thumbnailUrl]]));

		const artworks = await loadResolved();

		expect(fetchCommonsThumbnails).toHaveBeenCalledWith(['Test.jpg'], 500);
		expect(artworks[0].image).toMatchObject({ src: thumbnailUrl, width: 1000, height: 750 });
		expect(artworks[0].image?.srcset).toContain('960px-Test.jpg 960w');
		expect(artworks[0].image?.srcset).not.toContain('1280px-');
	});

	it('keeps a portrait size and small thumbnails for an image without a stored size', async () => {
		const thumbnailUrl = 'https://upload.wikimedia.org/thumb/a/ab/Test.jpg/500px-Test.jpg';
		query.range.mockResolvedValue({ data: [row({ source_image_file: 'Test.jpg' })], error: null });
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map([['Test.jpg', thumbnailUrl]]));

		const artworks = await loadResolved();

		expect(artworks[0].image).toMatchObject({ src: thumbnailUrl, ...DEFAULT_IMAGE_SIZE });
		expect(artworks[0].image?.srcset).toContain('500px-Test.jpg 500w');
		expect(artworks[0].image?.srcset).not.toContain('960px-');
	});

	it('falls back to the redirecting url without Commons and keeps the stored size', async () => {
		query.range.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', image_width: 600, image_height: 900 })],
			error: null
		});

		const artworks = await loadResolved();

		expect(artworks[0].image).toMatchObject({ width: 600, height: 900 });
		expect(artworks[0].image?.src).toContain('Special:FilePath/Test.jpg');
	});

	it('has no srcset for an image narrower than every thumbnail', async () => {
		query.range.mockResolvedValue({
			data: [row({ source_image_file: 'Tiny.jpg', image_width: 200, image_height: 300 })],
			error: null
		});

		const artworks = await loadResolved();

		expect(artworks[0].image?.srcset).toBeUndefined();
	});

	it('offers wall thumbnails up to 960 px even for a much larger image', async () => {
		const thumbnailUrl = 'https://upload.wikimedia.org/thumb/a/ab/Test.jpg/500px-Test.jpg';
		query.range.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', image_width: 6000, image_height: 8000 })],
			error: null
		});
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map([['Test.jpg', thumbnailUrl]]));

		const artworks = await loadResolved();

		expect(artworks[0].image?.srcset).toContain('960px-Test.jpg 960w');
		expect(artworks[0].image?.srcset).not.toContain('1280px-');
		expect(artworks[0].image?.srcset).not.toContain('1920px-');
	});

	it('shows a Commons image found on an earlier visit at once, without asking Commons again', async () => {
		const thumbnailUrl = 'https://upload.wikimedia.org/thumb/a/ab/Test.jpg/500px-Test.jpg';
		query.range.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', image_width: 1000, image_height: 750 })],
			error: null
		});
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map([['Test.jpg', thumbnailUrl]]));
		await loadResolved();

		const { artworks } = await loadAtelier();

		expect(artworks[0].pendingImage).toBeUndefined();
		expect(artworks[0].image).toMatchObject({ src: thumbnailUrl, width: 1000, height: 750 });
		expect(await resolveImages(artworks)).toEqual([]);
		expect(fetchCommonsThumbnails).toHaveBeenCalledOnce();
	});

	it('asks Commons again on the next visit for a file it did not answer', async () => {
		query.range.mockResolvedValue({ data: [row({ source_image_file: 'Test.jpg' })], error: null });
		await loadResolved();

		const { artworks } = await loadAtelier();

		expect(artworks[0].pendingImage).toEqual({ sourceFile: 'Test.jpg' });
	});

	it('reuses the signed url of an uploaded image on the next visit until it expires', async () => {
		vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
		query.range.mockResolvedValue({
			data: [row({ own_image_path: 'user-id/artwork-1/image.jpg' })],
			error: null
		});
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'user-id/artwork-1/image.jpg', signedUrl: 'https://example.com/signed' }],
			error: null
		});
		await loadResolved();

		vi.setSystemTime(1_000_000 + SIGNED_URL_SECONDS * 1000 - 1);
		const before = (await loadAtelier()).artworks[0];
		vi.setSystemTime(1_000_000 + SIGNED_URL_SECONDS * 1000);
		const after = (await loadAtelier()).artworks[0];
		vi.useRealTimers();

		expect(before.image?.src).toBe('https://example.com/signed');
		expect(before.imageSignedAt).toBe(1_000_000);
		expect(before.pendingImage).toBeUndefined();
		expect(after.pendingImage).toEqual({ ownPath: 'user-id/artwork-1/image.jpg' });
		expect(createSignedUrls).toHaveBeenCalledOnce();
	});

	it('prefers an uploaded image and signs its url', async () => {
		query.range.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', own_image_path: 'user-id/artwork-1/image.jpg' })],
			error: null
		});
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'user-id/artwork-1/image.jpg', signedUrl: 'https://example.com/signed' }],
			error: null
		});

		const artworks = await loadResolved();

		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(artworks[0].image).toEqual({ src: 'https://example.com/signed', ...DEFAULT_IMAGE_SIZE });
	});

	it('marks an uploaded image as unavailable when signing fails, and keeps the other artworks', async () => {
		query.range.mockResolvedValue({
			data: [
				row({ own_image_path: 'user-id/artwork-1/image.jpg' }),
				row({
					id: 'artwork-2',
					record_number: 2,
					own_image_url: 'https://example.com/image.jpg'
				})
			],
			error: null
		});
		createSignedUrls.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

		const artworks = await loadResolved();

		expect(artworks[0].image).toBeUndefined();
		expect(artworks[0].imageUnavailable).toBe(true);
		expect(artworks[1].image?.src).toBe('https://example.com/image.jpg');
		expect(artworks[1].imageUnavailable).toBeUndefined();
	});

	it('marks an uploaded image as unavailable when only its url could not be signed', async () => {
		query.range.mockResolvedValue({
			data: [row({ own_image_path: 'user-id/artwork-1/image.jpg' })],
			error: null
		});
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'user-id/artwork-1/image.jpg', signedUrl: null, error: 'Object not found' }],
			error: null
		});

		const artworks = await loadResolved();

		expect(artworks[0].imageUnavailable).toBe(true);
	});

	it('keeps the path and the time of signing of an uploaded image', async () => {
		vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
		query.range.mockResolvedValue({
			data: [row({ own_image_path: 'user-id/artwork-1/image.jpg' })],
			error: null
		});
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'user-id/artwork-1/image.jpg', signedUrl: 'https://example.com/signed' }],
			error: null
		});

		const artworks = await loadResolved();
		vi.useRealTimers();

		expect(artworks[0].ownImagePath).toBe('user-id/artwork-1/image.jpg');
		expect(artworks[0].imageSignedAt).toBe(1_000_000);
	});

	it('uses a linked image as it is, with its stored size', async () => {
		query.range.mockResolvedValue({
			data: [
				row({ own_image_url: 'https://example.com/image.jpg', image_width: 640, image_height: 480 })
			],
			error: null
		});

		const { artworks } = await loadAtelier();

		expect(createSignedUrls).not.toHaveBeenCalled();
		expect(artworks[0].image).toEqual({
			src: 'https://example.com/image.jpg',
			width: 640,
			height: 480
		});
	});

	it('returns a mapped message when loading fails', async () => {
		query.range.mockResolvedValue({
			data: null,
			error: { code: '', message: 'TypeError: Failed to fetch' }
		});

		await expect(loadAtelier()).resolves.toEqual({
			artworks: [],
			error: m.collectionErrors.network
		});
	});
});

describe('resolveImages', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resolvedImages.clear();
		vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrls } as never);
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map());
	});

	function pending(
		id: string,
		pendingImage: NonNullable<WallArtwork['pendingImage']>
	): WallArtwork {
		return {
			id,
			number: 1,
			title: 'Pending',
			authors: [],
			yearFrom: null,
			yearTo: null,
			eraCode: null,
			image: { ...DEFAULT_IMAGE_SIZE },
			pendingImage
		};
	}

	it('returns nothing and asks no one when no artwork waits for its image', async () => {
		await expect(
			resolveImages([{ ...pending('a', { sourceFile: 'A.jpg' }), pendingImage: undefined }])
		).resolves.toEqual([]);
		expect(fetchCommonsThumbnails).not.toHaveBeenCalled();
		expect(createSignedUrls).not.toHaveBeenCalled();
	});

	it('looks up the Commons files and signs the uploads of the given artworks together', async () => {
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'owner/own.jpg', signedUrl: 'https://example.com/signed' }],
			error: null
		});

		const resolved = await resolveImages([
			pending('a', { sourceFile: 'A.jpg' }),
			pending('b', { ownPath: 'owner/own.jpg' })
		]);

		expect(fetchCommonsThumbnails).toHaveBeenCalledWith(['A.jpg'], 500);
		expect(createSignedUrls).toHaveBeenCalledWith(['owner/own.jpg'], expect.any(Number));
		expect(resolved[0].pendingImage).toBeUndefined();
		expect(resolved[0].image?.src).toContain('Special:FilePath/A.jpg');
		expect(resolved[1].image?.src).toBe('https://example.com/signed');
		expect(resolved[1].imageSignedAt).toEqual(expect.any(Number));
	});
	it('looks up only the files and uploads it does not know yet', async () => {
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(
			new Map([['A.jpg', 'https://upload.wikimedia.org/thumb/a/ab/A.jpg/500px-A.jpg']])
		);
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'owner/own.jpg', signedUrl: 'https://example.com/signed' }],
			error: null
		});
		await resolveImages([
			pending('a', { sourceFile: 'A.jpg' }),
			pending('b', { ownPath: 'owner/own.jpg' })
		]);
		vi.clearAllMocks();
		vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrls } as never);
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map());

		const resolved = await resolveImages([
			pending('a', { sourceFile: 'A.jpg' }),
			pending('b', { ownPath: 'owner/own.jpg' }),
			pending('c', { sourceFile: 'C.jpg' })
		]);

		expect(fetchCommonsThumbnails).toHaveBeenCalledWith(['C.jpg'], 500);
		expect(createSignedUrls).not.toHaveBeenCalled();
		expect(resolved.map((artwork) => artwork.image?.src)).toEqual([
			'https://upload.wikimedia.org/thumb/a/ab/A.jpg/500px-A.jpg',
			'https://example.com/signed',
			expect.stringContaining('Special:FilePath/C.jpg')
		]);
	});
});

describe('loadTrash', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resolvedImages.clear();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrls } as never);
		query.select.mockReturnValue(query);
		query.not.mockReturnValue(query);
		query.order.mockReturnValue(query);
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map());
	});

	it('asks for artworks in the trash, most recently deleted first', async () => {
		query.range.mockResolvedValue({ data: [], error: null });

		await expect(loadTrash()).resolves.toEqual({ artworks: [] });
		expect(query.not).toHaveBeenCalledWith('deleted_at', 'is', null);
		expect(query.order).toHaveBeenCalledWith('deleted_at', { ascending: false });
		expect(query.order).toHaveBeenCalledWith('id', { ascending: false });
		expect(query.range).toHaveBeenCalledWith(0, 999);
	});

	it('keeps asking for the next 1000 artworks in the trash until a page is not full', async () => {
		const page = (from: number, count: number): Record<string, unknown>[] =>
			Array.from({ length: count }, (_, index) =>
				row({ id: `artwork-${from + index}`, deleted_at: '2026-10-12T10:00:00Z' })
			);
		query.range
			.mockResolvedValueOnce({ data: page(0, 1000), error: null })
			.mockResolvedValueOnce({ data: page(1000, 3), error: null });

		const { artworks } = await loadTrash();

		expect(artworks).toHaveLength(1003);
		expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
	});

	it('adds when each artwork was deleted and the path of its uploaded image', async () => {
		query.range.mockResolvedValue({
			data: [
				row({
					own_image_path: 'owner/image.jpg',
					deleted_at: '2026-10-12T14:00:00+00:00',
					artwork_values: [author('First Author', 0)]
				})
			],
			error: null
		});

		const { artworks } = await loadTrash();

		expect(artworks).toEqual([
			expect.objectContaining({
				number: 1,
				authors: ['First Author'],
				deletedAt: '2026-10-12T14:00:00+00:00',
				ownImagePath: 'owner/image.jpg'
			})
		]);
	});

	it('shows a thumbnail only for a Commons image and never fetches an uploaded or linked one', async () => {
		const thumbnailUrl = 'https://upload.wikimedia.org/thumb/a/ab/Test.jpg/500px-Test.jpg';
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map([['Test.jpg', thumbnailUrl]]));
		const deleted_at = '2026-10-12T14:00:00+00:00';
		query.range.mockResolvedValue({
			data: [
				row({ source_image_file: 'Test.jpg', deleted_at }),
				row({ id: 'artwork-2', own_image_path: 'owner/image.jpg', deleted_at }),
				row({ id: 'artwork-3', own_image_url: 'https://example.com/image.jpg', deleted_at })
			],
			error: null
		});

		const { artworks } = await loadTrash();

		expect(artworks[0].image?.src).toBe(thumbnailUrl);
		expect(artworks[1].image).toBeUndefined();
		expect(artworks[2].image).toBeUndefined();
		expect(artworks[1].pendingImage).toBeUndefined();
		expect(fetchCommonsThumbnails).toHaveBeenCalledWith(['Test.jpg'], 500);
		expect(createSignedUrls).not.toHaveBeenCalled();
	});

	it('returns a mapped message when loading fails', async () => {
		query.range.mockResolvedValue({
			data: null,
			error: { code: '', message: 'TypeError: Failed to fetch' }
		});

		await expect(loadTrash()).resolves.toEqual({
			artworks: [],
			error: m.collectionErrors.network
		});
	});
});

describe('refreshExpiredImages', () => {
	const lifetime = SIGNED_URL_SECONDS * 1000;

	function uploaded(id: string, signedAt: number): WallArtwork {
		return {
			id,
			number: 1,
			title: 'The Test Painting',
			authors: [],
			yearFrom: null,
			yearTo: null,
			eraCode: null,
			image: { src: `https://example.com/old-${id}`, width: 4, height: 5 },
			ownImagePath: `user-id/${id}/image.jpg`,
			imageSignedAt: signedAt
		};
	}

	beforeEach(() => {
		vi.clearAllMocks();
		resolvedImages.clear();
		vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrls } as never);
	});

	it('signs again, in one request, only the images whose url has expired', async () => {
		createSignedUrls.mockResolvedValue({
			data: [
				{ path: 'user-id/a/image.jpg', signedUrl: 'https://example.com/new-a' },
				{ path: 'user-id/b/image.jpg', signedUrl: 'https://example.com/new-b' }
			],
			error: null
		});
		const now = 10 * lifetime;

		const refreshed = await refreshExpiredImages(
			[uploaded('a', now - lifetime), uploaded('b', now - lifetime - 1), uploaded('c', now - 1)],
			now
		);

		expect(createSignedUrls).toHaveBeenCalledTimes(1);
		expect(createSignedUrls).toHaveBeenCalledWith(
			['user-id/a/image.jpg', 'user-id/b/image.jpg'],
			SIGNED_URL_SECONDS
		);
		expect(refreshed.map((artwork) => artwork.id)).toEqual(['a', 'b']);
		expect(refreshed[0].image?.src).toBe('https://example.com/new-a');
		expect(refreshed[0].imageSignedAt).toBe(now);
	});

	it('remembers the new url for the next visit to the wall', async () => {
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'user-id/a/image.jpg', signedUrl: 'https://example.com/new-a' }],
			error: null
		});
		const now = Date.now();

		await refreshExpiredImages([uploaded('a', now - lifetime)], now);

		expect(resolvedImages.signedUrl('user-id/a/image.jpg', now)).toEqual({
			url: 'https://example.com/new-a',
			signedAt: now
		});
	});

	it('does not sign again an image that failed before its url expired', async () => {
		const now = 10 * lifetime;

		const refreshed = await refreshExpiredImages([uploaded('a', now - lifetime + 1)], now);

		expect(createSignedUrls).not.toHaveBeenCalled();
		expect(refreshed).toEqual([]);
	});

	it('marks the image as unavailable when signing fails again', async () => {
		createSignedUrls.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
		const now = 10 * lifetime;

		const [refreshed] = await refreshExpiredImages([uploaded('a', now - lifetime)], now);

		expect(refreshed.image).toBeUndefined();
		expect(refreshed.imageUnavailable).toBe(true);
		expect(refreshed.imageSignedAt).toBe(now);
	});
});
