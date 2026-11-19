import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { saveImageCheck } from './broken-images-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

type Filters = {
	eq: ReturnType<typeof vi.fn>;
	is: ReturnType<typeof vi.fn>;
	not: ReturnType<typeof vi.fn>;
} & PromiseLike<{ error: unknown }>;

function table(error: unknown): { update: ReturnType<typeof vi.fn>; filters: Filters } {
	const filters = {
		eq: vi.fn(),
		is: vi.fn(),
		not: vi.fn(),
		then: (resolve, reject) => Promise.resolve({ error }).then(resolve, reject)
	} as Filters;
	filters.eq.mockReturnValue(filters);
	filters.is.mockReturnValue(filters);
	filters.not.mockReturnValue(filters);
	const update = vi.fn().mockReturnValue(filters);
	vi.mocked(supabase.from).mockReturnValue({ update } as never);
	return { update, filters };
}

describe('saveImageCheck', () => {
	beforeEach(() => vi.mocked(supabase.from).mockReset());

	it('marks a working image broken only while its source is the same', async () => {
		const { update, filters } = table(null);
		const saved = await saveImageCheck({
			id: 'image-1',
			column: 'own_image_path',
			value: 'owner/a.jpg',
			broken: true
		});
		expect(saved).toBe(true);
		expect(supabase.from).toHaveBeenCalledWith('artwork_images');
		expect(update.mock.calls[0][0].broken_at).toEqual(expect.any(String));
		expect(filters.eq).toHaveBeenCalledWith('id', 'image-1');
		expect(filters.eq).toHaveBeenCalledWith('own_image_path', 'owner/a.jpg');
		expect(filters.is).toHaveBeenCalledWith('broken_at', null);
	});

	it('clears only an image that is marked broken', async () => {
		const { update, filters } = table(null);
		await saveImageCheck({
			id: 'image-1',
			column: 'source_image_file',
			value: 'A.jpg',
			broken: false
		});
		expect(update).toHaveBeenCalledWith({ broken_at: null });
		expect(filters.not).toHaveBeenCalledWith('broken_at', 'is', null);
	});

	it('tells when the save fails', async () => {
		table(new Error('Network'));
		await expect(
			saveImageCheck({ id: 'image-1', column: 'own_image_path', value: 'a', broken: true })
		).resolves.toBe(false);
	});
});
