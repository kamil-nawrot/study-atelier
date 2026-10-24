import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { findDuplicates } from './duplicates-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

const query = {
	select: vi.fn(),
	is: vi.fn()
};

describe('findDuplicates', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.select.mockReturnValue(query);
	});

	it('compares with artworks outside the trash', async () => {
		query.is.mockResolvedValue({
			data: [
				{
					id: 'artwork-5',
					record_number: 5,
					title: 'Sunflowers',
					artwork_values: [
						{ category_values: { category_code: 'style', name: 'Post-Impressionism' } },
						{ category_values: { category_code: 'author', name: 'Vincent van Gogh' } }
					]
				}
			],
			error: null
		});

		await expect(
			findDuplicates({ title: 'Sunflowers', authors: ['Vincent van Gogh'] })
		).resolves.toEqual([5]);
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.is).toHaveBeenCalledWith('deleted_at', null);
	});

	it('finds nothing when the artworks cannot be read', async () => {
		query.is.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

		await expect(
			findDuplicates({ title: 'Sunflowers', authors: ['Vincent van Gogh'] })
		).resolves.toEqual([]);
	});
});
