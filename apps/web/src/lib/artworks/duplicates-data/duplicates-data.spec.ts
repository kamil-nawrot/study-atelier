import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { findDuplicates } from './duplicates-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn() }
}));

const rpc = vi.mocked(supabase.rpc);

describe('findDuplicates', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks the database for the artworks with the same title and compares their authors', async () => {
		rpc.mockResolvedValue({
			data: [
				{ id: 'artwork-5', record_number: 5, title: 'Sunflowers', authors: ['Vincent van Gogh'] },
				{ id: 'artwork-6', record_number: 6, title: 'sunflowers', authors: ['Paul Gauguin'] }
			],
			error: null
		} as never);

		await expect(
			findDuplicates({ title: 'Sunflowers', authors: ['Vincent van Gogh'] })
		).resolves.toEqual([5]);
		expect(rpc).toHaveBeenCalledWith('duplicate_candidates', { title: 'Sunflowers' });
	});

	it('leaves out the artwork being edited', async () => {
		rpc.mockResolvedValue({
			data: [{ id: 'artwork-5', record_number: 5, title: 'Sunflowers', authors: [] }],
			error: null
		} as never);

		await expect(
			findDuplicates({ title: 'Sunflowers', authors: [] }, 'artwork-5')
		).resolves.toEqual([]);
	});

	it('finds nothing when the artworks cannot be read', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } } as never);

		await expect(
			findDuplicates({ title: 'Sunflowers', authors: ['Vincent van Gogh'] })
		).resolves.toEqual([]);
	});
});
