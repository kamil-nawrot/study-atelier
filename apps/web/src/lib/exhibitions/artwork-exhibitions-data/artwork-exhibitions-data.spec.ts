import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadArtworksByIds } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import { loadArtworkExhibitions } from './artwork-exhibitions-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworksByIds: vi.fn()
}));

const from = vi.mocked(supabase.from);

function exhibitions(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'eq', 'is']) query[name] = vi.fn().mockReturnValue(query);
	query.order = vi.fn().mockResolvedValue(result);
	return query;
}

const light = {
	id: 'e1',
	title: 'Light',
	updated_at: '2026-11-01T10:00:00Z',
	deleted_at: null,
	exhibition_artworks: [
		{ artwork_id: 'a1', position: 0, artworks: { deleted_at: null } },
		{ artwork_id: 'a2', position: 1, artworks: { deleted_at: null } }
	]
};

describe('loadArtworkExhibitions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the exhibitions that hold the artwork, with their covers, in one query', async () => {
		const query = exhibitions({ data: [light], error: null });
		from.mockReturnValueOnce(query as never);
		vi.mocked(loadArtworksByIds).mockResolvedValue({ artworks: [{ id: 'a1' } as never] });

		const result = await loadArtworkExhibitions('a2');

		expect(result.exhibitions).toEqual([
			{
				id: 'e1',
				title: 'Light',
				updatedAt: '2026-11-01T10:00:00Z',
				artworkCount: 2,
				coverId: 'a1'
			}
		]);
		expect(result.covers).toHaveLength(1);
		expect(result.error).toBeUndefined();
		expect(from).toHaveBeenCalledTimes(1);
		expect(query.eq).toHaveBeenCalledWith('holding.artwork_id', 'a2');
		expect(loadArtworksByIds).toHaveBeenCalledWith(['a1']);
	});

	it('asks nothing more when no exhibition holds the artwork', async () => {
		from.mockReturnValueOnce(exhibitions({ data: [], error: null }) as never);

		const result = await loadArtworkExhibitions('a2');

		expect(result).toEqual({ exhibitions: [], covers: [] });
		expect(loadArtworksByIds).not.toHaveBeenCalled();
	});

	it('reports a failure of the exhibitions', async () => {
		from.mockReturnValueOnce(exhibitions({ data: null, error: { message: 'boom' } }) as never);

		expect((await loadArtworkExhibitions('a2')).error).toBeDefined();
	});

	it('keeps the exhibitions and reports a failure of the covers', async () => {
		from.mockReturnValueOnce(exhibitions({ data: [light], error: null }) as never);
		vi.mocked(loadArtworksByIds).mockResolvedValue({ artworks: [], error: 'Offline' });

		const result = await loadArtworkExhibitions('a2');

		expect(result.exhibitions).toHaveLength(1);
		expect(result.covers).toEqual([]);
		expect(result.error).toBe('Offline');
	});
});
