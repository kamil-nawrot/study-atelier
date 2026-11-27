import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';
import { loadLearnerValues } from './album-values-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

function value(overrides: Partial<AlbumValue>): AlbumValue {
	return {
		id: 'value',
		revision: 1,
		category: 'material',
		wikidataId: null,
		birthYear: null,
		deathYear: null,
		yearsApproximate: false,
		countryCode: null,
		placeType: null,
		name: 'wapień',
		alternativeNames: [],
		summary: null,
		description: null,
		country: null,
		...overrides
	};
}

type Answer = { data: unknown; error: unknown };

function answer(tables: Record<string, Answer>): {
	ilike: ReturnType<typeof vi.fn>;
	inIds: ReturnType<typeof vi.fn>;
} {
	const ilike = vi.fn(() => Promise.resolve(tables.category_values));
	const inIds = vi.fn();
	vi.mocked(supabase.from).mockImplementation((table: string) => {
		const result = tables[table];
		const select = vi.fn(() => ({
			eq: vi.fn(() => ({ ilike })),
			in: (...args: unknown[]) => {
				inIds(...args);
				return Promise.resolve(result);
			}
		}));
		return { select } as never;
	});
	return { ilike, inIds };
}

describe('loadLearnerValues', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks for every name and alternative name and for the Wikidata ids of authors', async () => {
		const calls = answer({
			category_values: { data: [{ category_code: 'material', name: 'Wapień' }], error: null },
			author_details: {
				data: [{ wikidata: 'Q5582', category_values: { name: 'van Gogh' } }],
				error: null
			}
		});

		const result = await loadLearnerValues([
			value({ alternativeNames: ['wapienie'] }),
			value({ category: 'author', name: 'Vincent van Gogh', wikidataId: 'Q5582' })
		]);

		expect(calls.ilike.mock.calls).toEqual([
			['name', 'wapień'],
			['name', 'wapienie'],
			['name', 'Vincent van Gogh']
		]);
		expect(calls.inIds).toHaveBeenCalledWith('source_wikidata_id', ['Q5582']);
		expect(result.values).toEqual([
			{ category: 'author', name: 'van Gogh', wikidataId: 'Q5582' },
			{ category: 'material', name: 'Wapień', wikidataId: null },
			{ category: 'material', name: 'Wapień', wikidataId: null },
			{ category: 'material', name: 'Wapień', wikidataId: null }
		]);
	});

	it('reports a failed read', async () => {
		answer({ category_values: { data: null, error: { message: 'offline' } } });

		const result = await loadLearnerValues([value({})]);

		expect(result.values).toEqual([]);
		expect(result.error).toBeTruthy();
	});
});
