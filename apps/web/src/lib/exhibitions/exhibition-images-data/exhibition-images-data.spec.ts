import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadArtworkImages } from './exhibition-images-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('loadArtworkImages', () => {
	function imageRows(data: unknown, error: unknown = null): void {
		const order = vi.fn().mockResolvedValue({ data, error });
		const inFilter = vi.fn().mockReturnValue({ order });
		from.mockReturnValue({ select: vi.fn().mockReturnValue({ in: inFilter }) } as never);
	}

	it('groups the images of each artwork in their order', async () => {
		const base = {
			source_wikidata_id: null,
			source_image_file: null,
			source_image_licence: null,
			source_image_licence_url: null,
			source_image_attribution: null,
			own_image_path: null,
			image_width: 100,
			image_height: 200,
			palette: null
		};
		imageRows([
			{
				...base,
				id: 'i1',
				artwork_id: 'a',
				position: 0,
				own_image_url: 'https://example.test/1.jpg'
			},
			{
				...base,
				id: 'i2',
				artwork_id: 'b',
				position: 0,
				own_image_url: 'https://example.test/2.jpg'
			},
			{
				...base,
				id: 'i3',
				artwork_id: 'a',
				position: 1,
				own_image_url: 'https://example.test/3.jpg'
			}
		]);

		const { images } = await loadArtworkImages(['a', 'b']);

		expect(images.get('a')?.map((image) => image.id)).toEqual(['i1', 'i3']);
		expect(images.get('b')?.map((image) => image.id)).toEqual(['i2']);
	});

	it('skips a row that holds no image', async () => {
		imageRows([
			{
				id: 'i1',
				artwork_id: 'a',
				position: 0,
				palette: null,
				source_wikidata_id: null,
				source_image_file: null,
				own_image_path: null,
				own_image_url: null,
				image_width: null,
				image_height: null
			}
		]);

		expect((await loadArtworkImages(['a'])).images.size).toBe(0);
	});

	it('does not ask for nothing', async () => {
		expect(await loadArtworkImages([])).toEqual({ images: new Map() });
		expect(from).not.toHaveBeenCalled();
	});

	it('reports a failure', async () => {
		imageRows(null, { code: 'XX', message: 'Boom' });

		const { images, error } = await loadArtworkImages(['a']);

		expect(images.size).toBe(0);
		expect(error).toBeTruthy();
	});
});
