import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { savePalette } from './palette-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const PALETTE = [{ color: '#aa8855', share: 1 }];

function table(error: unknown): { update: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn> } {
	const filters: { eq: ReturnType<typeof vi.fn> } & PromiseLike<{ error: unknown }> = {
		eq: vi.fn(),
		then: (resolve, reject) => Promise.resolve({ error }).then(resolve, reject)
	};
	filters.eq.mockReturnValue(filters);
	const update = vi.fn().mockReturnValue(filters);
	vi.mocked(supabase.from).mockReturnValue({ update } as never);
	return { update, eq: filters.eq };
}

const linked: ArtworkImageInput = {
	id: 'image-1',
	kind: 'url',
	url: 'https://images.example.test/a.jpg',
	width: 4,
	height: 3
};

describe('savePalette', () => {
	beforeEach(() => vi.mocked(supabase.from).mockReset());

	it('stores the palette on the image only while it still shows the same picture', async () => {
		const { update, eq } = table(null);

		expect(await savePalette(linked, PALETTE)).toBe(true);

		expect(supabase.from).toHaveBeenCalledWith('artwork_images');
		expect(update).toHaveBeenCalledWith({ palette: PALETTE });
		expect(eq.mock.calls).toEqual([
			['id', 'image-1'],
			['own_image_url', 'https://images.example.test/a.jpg']
		]);
	});

	it('matches a Commons image by its file and an own image by its path', async () => {
		const { eq } = table(null);

		await savePalette(
			{
				id: 'image-2',
				kind: 'commons',
				wikidataId: 'Q1',
				file: 'Vermeer.jpg',
				licence: null,
				licenceUrl: null,
				attribution: null,
				width: null,
				height: null
			},
			PALETTE
		);
		await savePalette(
			{ id: 'image-3', kind: 'upload', path: 'owner/own.jpg', width: null, height: null },
			PALETTE
		);

		expect(eq.mock.calls).toEqual([
			['id', 'image-2'],
			['source_image_file', 'Vermeer.jpg'],
			['id', 'image-3'],
			['own_image_path', 'owner/own.jpg']
		]);
	});

	it('stores nothing for an image without an id or not uploaded yet', async () => {
		table(null);

		expect(await savePalette({ ...linked, id: undefined }, PALETTE)).toBe(false);
		expect(
			await savePalette(
				{
					id: 'image-4',
					kind: 'file',
					file: new File([], 'a.jpg'),
					previewUrl: 'blob:a',
					width: 1,
					height: 1
				},
				PALETTE
			)
		).toBe(false);
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('reports a failure', async () => {
		table({ message: 'denied' });

		expect(await savePalette(linked, PALETTE)).toBe(false);
	});
});
