import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { artworkFilter, loadAtelierMatches, titlePattern } from './album-matches-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

function query(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const chain: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'is', 'or', 'in', 'order'])
		chain[name] = vi.fn().mockReturnValue(chain);
	chain.range = vi.fn().mockResolvedValue(result);
	return chain;
}

const taken = { id: 'a1', record_number: 3, title: 'My Venus', album_entry: 'sample/venus' };
const named = { id: 'a2', record_number: 7, title: 'Lion Man', album_entry: null };

describe('artworkFilter', () => {
	it('asks for the entries of every album and every title', () => {
		expect(
			artworkFilter({ slugs: ['sample', 'caves'], wikidataIds: [], titles: ['Lion Man', ' '] })
		).toBe('album_entry.like.sample/*,album_entry.like.caves/*,title.ilike."Lion Man"');
	});

	it('quotes a title so its commas and brackets stay part of it', () => {
		expect(titlePattern(' Venus (of Laussel), "the horn" ')).toBe(
			'"Venus (of Laussel), _the horn_"'
		);
		expect(titlePattern('A\\B')).toBe('"A_B"');
	});
});

describe('loadAtelierMatches', () => {
	beforeEach(() => vi.clearAllMocks());

	it('merges the artworks found by entry or title with those found by Wikidata id', async () => {
		const artworks = query({ data: [taken, named], error: null });
		const images = query({
			data: [
				{ source_wikidata_id: 'Q131397', artworks: taken },
				{ source_wikidata_id: 'Q2', artworks: { ...named, id: 'a3', record_number: 1 } }
			],
			error: null
		});
		from.mockImplementation((table) => (table === 'artworks' ? artworks : images) as never);

		const result = await loadAtelierMatches({
			slugs: ['sample'],
			wikidataIds: ['Q131397', 'Q2'],
			titles: ['Lion Man']
		});

		expect(result).toEqual({
			matches: [
				{ id: 'a3', number: 1, title: 'Lion Man', albumEntry: null, wikidataIds: ['Q2'] },
				{
					id: 'a1',
					number: 3,
					title: 'My Venus',
					albumEntry: 'sample/venus',
					wikidataIds: ['Q131397']
				},
				{ id: 'a2', number: 7, title: 'Lion Man', albumEntry: null, wikidataIds: [] }
			]
		});
		expect(artworks.is).toHaveBeenCalledWith('deleted_at', null);
		expect(artworks.or).toHaveBeenCalledWith('album_entry.like.sample/*,title.ilike."Lion Man"');
		expect(images.in).toHaveBeenCalledWith('source_wikidata_id', ['Q131397', 'Q2']);
		expect(images.is).toHaveBeenCalledWith('artworks.deleted_at', null);
	});

	it('asks nothing when there is nothing to look for', async () => {
		await expect(loadAtelierMatches({ slugs: [], wikidataIds: [], titles: [] })).resolves.toEqual({
			matches: []
		});
		expect(from).not.toHaveBeenCalled();
	});

	it('says so when the atelier cannot be read', async () => {
		from.mockReturnValue(
			query({ data: null, error: { message: 'TypeError: Failed to fetch' } }) as never
		);

		await expect(
			loadAtelierMatches({ slugs: ['sample'], wikidataIds: [], titles: [] })
		).resolves.toEqual({ matches: [], error: m.collectionErrors.network });
	});
});
