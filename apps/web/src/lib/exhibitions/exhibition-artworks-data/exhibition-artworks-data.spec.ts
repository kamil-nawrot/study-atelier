import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { fetchAllRows } from '#lib/wall/wall-data/wall-data.ts';
import {
	loadArtworkNotes,
	loadArtworksByIds,
	loadRecentArtworks,
	searchArtworks
} from './exhibition-artworks-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	ARTWORK_COLUMNS: '*',
	fetchAllRows: vi.fn(),
	wallArtwork: (row: { id: string }) => testArtwork(Number(row.id.split('-')[1]), row.id),
	rememberedArtwork: () => undefined
}));

const rpc = vi.mocked(supabase.rpc);
const from = vi.mocked(supabase.from);
const rows = vi.mocked(fetchAllRows);

function row(number: number): { id: string } {
	return { id: `artwork-${number}` };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('loadArtworksByIds', () => {
	it('returns the artworks in the order of the ids and skips the ones that are gone', async () => {
		rows.mockResolvedValue({ rows: [row(2), row(1)] } as never);

		const { artworks } = await loadArtworksByIds(['artwork-1', 'artwork-3', 'artwork-2']);

		expect(artworks.map((artwork) => artwork.id)).toEqual(['artwork-1', 'artwork-2']);
	});

	it('asks for at most fifty artworks at a time', async () => {
		rows.mockResolvedValue({ rows: [] } as never);

		await loadArtworksByIds(Array.from({ length: 120 }, (_, index) => `artwork-${index}`));

		expect(rows).toHaveBeenCalledTimes(3);
	});

	it('does not ask for nothing', async () => {
		expect(await loadArtworksByIds([])).toEqual({ artworks: [] });
		expect(rows).not.toHaveBeenCalled();
	});

	it('reports a failure of any part', async () => {
		rows.mockResolvedValue({ rows: [], error: 'Boom' } as never);

		expect(await loadArtworksByIds(['artwork-1'])).toEqual({ artworks: [], error: 'Boom' });
	});
});

describe('loadRecentArtworks', () => {
	it('returns the newest artworks', async () => {
		rows.mockResolvedValue({ rows: [row(9), row(8)] } as never);

		const { artworks } = await loadRecentArtworks();

		expect(artworks.map((artwork) => artwork.id)).toEqual(['artwork-9', 'artwork-8']);
	});
});

describe('searchArtworks', () => {
	it('loads the artworks that the link search finds and ignores the other kinds', async () => {
		rpc.mockReturnValue({
			abortSignal: vi.fn(),
			then: (resolve: (value: unknown) => unknown) =>
				resolve({
					data: [
						{ kind: 'artwork', id: 'artwork-4' },
						{ kind: 'value', id: 'period-baroque' }
					],
					error: null
				})
		} as never);
		rows.mockResolvedValue({ rows: [row(4)] } as never);

		const { artworks } = await searchArtworks('jud');

		expect(rpc).toHaveBeenCalledWith('note_link_suggestions', { link_trigger: '#', phrase: 'jud' });
		expect(artworks.map((artwork) => artwork.id)).toEqual(['artwork-4']);
	});

	it('reports a failure', async () => {
		rpc.mockReturnValue({
			then: (resolve: (value: unknown) => unknown) =>
				resolve({ data: null, error: { message: 'Failed to fetch' } })
		} as never);

		const { artworks, error } = await searchArtworks('jud');

		expect(artworks).toEqual([]);
		expect(error).toBeTruthy();
	});
});

describe('loadArtworkNotes', () => {
	it('maps the ids to their notes', async () => {
		const query = {
			select: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			is: vi.fn().mockResolvedValue({
				data: [
					{ id: 'a', notes: 'Rome.' },
					{ id: 'b', notes: null }
				],
				error: null
			})
		};
		from.mockReturnValue(query as never);

		const { notes } = await loadArtworkNotes(['a', 'b']);

		expect([...notes]).toEqual([
			['a', 'Rome.'],
			['b', '']
		]);
	});

	it('does not ask for nothing', async () => {
		expect((await loadArtworkNotes([])).notes.size).toBe(0);
		expect(from).not.toHaveBeenCalled();
	});
});
