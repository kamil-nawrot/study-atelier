import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCommonsThumbnails } from '#lib/images/commons.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { DEFAULT_IMAGE_SIZE, IMAGES_BUCKET, loadAtelier } from './artworks.ts';

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
	order: vi.fn()
};
const createSignedUrls = vi.fn();

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'artwork-1',
		record_number: 1,
		title: 'The Test Painting',
		year: 1490,
		year_approximate: true,
		source_image_file: null,
		own_image_path: null,
		own_image_url: null,
		image_width: null,
		image_height: null,
		artwork_values: [],
		...overrides
	};
}

function author(name: string, position: number): Record<string, unknown> {
	return { position, category_values: { category_code: 'author', name } };
}

describe('loadAtelier', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrls } as never);
		query.select.mockReturnValue(query);
		query.is.mockReturnValue(query);
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map());
	});

	it('asks for artworks outside the trash, newest first', async () => {
		query.order.mockResolvedValue({ data: [], error: null });

		await expect(loadAtelier()).resolves.toEqual({ artworks: [] });
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.select).toHaveBeenCalledWith(expect.stringContaining('image_width, image_height'));
		expect(query.is).toHaveBeenCalledWith('deleted_at', null);
		expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
	});

	it('lists authors in their order and formats the date', async () => {
		query.order.mockResolvedValue({
			data: [
				row({
					artwork_values: [
						author('Second Author', 1),
						{ position: 0, category_values: { category_code: 'style', name: 'Baroque' } },
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
				image: undefined
			}
		]);
	});

	it('uses the stored size and the thumbnail from Commons for a Commons image', async () => {
		const thumbnailUrl = 'https://upload.wikimedia.org/thumb/a/ab/Test.jpg/500px-Test.jpg';
		query.order.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', image_width: 1000, image_height: 750 })],
			error: null
		});
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map([['Test.jpg', thumbnailUrl]]));

		const { artworks } = await loadAtelier();

		expect(fetchCommonsThumbnails).toHaveBeenCalledWith(['Test.jpg'], 500);
		expect(artworks[0].image).toMatchObject({ src: thumbnailUrl, width: 1000, height: 750 });
		expect(artworks[0].image?.srcset).toContain('960px-Test.jpg 960w');
		expect(artworks[0].image?.srcset).not.toContain('1280px-');
	});

	it('keeps a portrait size and small thumbnails for an image without a stored size', async () => {
		const thumbnailUrl = 'https://upload.wikimedia.org/thumb/a/ab/Test.jpg/500px-Test.jpg';
		query.order.mockResolvedValue({ data: [row({ source_image_file: 'Test.jpg' })], error: null });
		vi.mocked(fetchCommonsThumbnails).mockResolvedValue(new Map([['Test.jpg', thumbnailUrl]]));

		const { artworks } = await loadAtelier();

		expect(artworks[0].image).toMatchObject({ src: thumbnailUrl, ...DEFAULT_IMAGE_SIZE });
		expect(artworks[0].image?.srcset).toContain('500px-Test.jpg 500w');
		expect(artworks[0].image?.srcset).not.toContain('960px-');
	});

	it('falls back to the redirecting url without Commons and keeps the stored size', async () => {
		query.order.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', image_width: 600, image_height: 900 })],
			error: null
		});

		const { artworks } = await loadAtelier();

		expect(artworks[0].image).toMatchObject({ width: 600, height: 900 });
		expect(artworks[0].image?.src).toContain('Special:FilePath/Test.jpg');
	});

	it('has no srcset for an image narrower than every thumbnail', async () => {
		query.order.mockResolvedValue({
			data: [row({ source_image_file: 'Tiny.jpg', image_width: 200, image_height: 300 })],
			error: null
		});

		const { artworks } = await loadAtelier();

		expect(artworks[0].image?.srcset).toBeUndefined();
	});

	it('prefers an uploaded image and signs its url', async () => {
		query.order.mockResolvedValue({
			data: [row({ source_image_file: 'Test.jpg', own_image_path: 'user-id/artwork-1/image.jpg' })],
			error: null
		});
		createSignedUrls.mockResolvedValue({
			data: [{ path: 'user-id/artwork-1/image.jpg', signedUrl: 'https://example.com/signed' }],
			error: null
		});

		const { artworks } = await loadAtelier();

		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(artworks[0].image).toEqual({ src: 'https://example.com/signed', ...DEFAULT_IMAGE_SIZE });
	});

	it('uses a linked image as it is, with its stored size', async () => {
		query.order.mockResolvedValue({
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
		query.order.mockResolvedValue({
			data: null,
			error: { code: '', message: 'TypeError: Failed to fetch' }
		});

		await expect(loadAtelier()).resolves.toEqual({
			artworks: [],
			error: m.collectionErrors.network
		});
	});
});
