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

function holding(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	query.select = vi.fn().mockReturnValue(query);
	query.eq = vi.fn().mockResolvedValue(result);
	return query;
}

function exhibitions(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'in', 'is']) query[name] = vi.fn().mockReturnValue(query);
	query.order = vi.fn().mockResolvedValue(result);
	return query;
}

describe('loadArtworkExhibitions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the exhibitions that hold the artwork, with their covers', async () => {
		from.mockReturnValueOnce(holding({ data: [{ exhibition_id: 'e1' }], error: null }) as never);
		from.mockReturnValueOnce(
			exhibitions({
				data: [
					{
						id: 'e1',
						title: 'Light',
						updated_at: '2026-11-01T10:00:00Z',
						deleted_at: null,
						exhibition_artworks: [
							{ artwork_id: 'a1', position: 0 },
							{ artwork_id: 'a2', position: 1 }
						]
					}
				],
				error: null
			}) as never
		);
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
		expect(loadArtworksByIds).toHaveBeenCalledWith(['a1']);
	});

	it('asks nothing more when no exhibition holds the artwork', async () => {
		from.mockReturnValueOnce(holding({ data: [], error: null }) as never);

		const result = await loadArtworkExhibitions('a2');

		expect(result).toEqual({ exhibitions: [], covers: [] });
		expect(from).toHaveBeenCalledTimes(1);
	});

	it('reports a failure of either step', async () => {
		from.mockReturnValueOnce(holding({ data: null, error: { message: 'boom' } }) as never);
		expect((await loadArtworkExhibitions('a2')).error).toBeDefined();

		from.mockReturnValueOnce(holding({ data: [{ exhibition_id: 'e1' }], error: null }) as never);
		from.mockReturnValueOnce(exhibitions({ data: null, error: { message: 'boom' } }) as never);
		expect((await loadArtworkExhibitions('a2')).error).toBeDefined();
	});
});
