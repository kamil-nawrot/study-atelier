import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { loadPlaceStarter } from './place-starter-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

type Query = Record<'select' | 'not' | 'order' | 'range', ReturnType<typeof vi.fn>>;

function query(...pages: { data: unknown; error: unknown }[]): Query {
	const chain = {} as Query;
	for (const name of ['select', 'not', 'order'] as const) {
		chain[name] = vi.fn().mockReturnValue(chain);
	}
	chain.range = vi.fn();
	for (const page of pages) chain.range.mockResolvedValueOnce(page);
	return chain;
}

function serve(museums: Query, places: Query): void {
	vi.mocked(supabase.from).mockImplementation(((table: string) =>
		table === 'catalogue_museums' ? museums : places) as never);
}

describe('loadPlaceStarter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads the catalogue and the countries of the places the learner has', async () => {
		const places = query({
			data: [
				{ country_code: 'FR', category_values: { name: 'Louvre' } },
				{ country_code: null, category_values: { name: 'Cellar' } }
			],
			error: null
		});
		serve(
			query({
				data: [
					{ name: 'Luwr', english_name: 'Louvre Museum', country_code: 'FR' },
					{ name: 'Rijksmuseum', english_name: null, country_code: 'NL' }
				],
				error: null
			}),
			places
		);

		const starter = await loadPlaceStarter();

		expect(supabase.from).toHaveBeenCalledWith('catalogue_museums');
		expect(supabase.from).toHaveBeenCalledWith('location_details');
		expect(places.not).toHaveBeenCalledWith('country_code', 'is', null);
		expect(starter.museums).toEqual([
			{ name: 'Luwr', aliases: ['Louvre Museum'], note: 'Francja' },
			{ name: 'Rijksmuseum', aliases: [], note: 'Holandia' }
		]);
		expect(starter.notes).toEqual({ louvre: 'Francja' });
	});

	it('reads past the first 1000 museums and places', async () => {
		const museum = { name: 'Luwr', english_name: null, country_code: 'FR' };
		const museums = query(
			{ data: Array.from({ length: 1000 }, () => museum), error: null },
			{ data: [{ name: 'Prado', english_name: null, country_code: 'ES' }], error: null }
		);
		const places = query(
			{
				data: Array.from({ length: 1000 }, (_, index) => ({
					country_code: 'FR',
					category_values: { name: `Place ${index}` }
				})),
				error: null
			},
			{ data: [{ country_code: 'ES', category_values: { name: 'Last' } }], error: null }
		);
		serve(museums, places);

		const starter = await loadPlaceStarter();

		expect(museums.range).toHaveBeenNthCalledWith(2, 1000, 1999);
		expect(museums.order).toHaveBeenCalledWith('wikidata_id');
		expect(places.order).toHaveBeenCalledWith('value_id');
		expect(starter.museums.at(-1)?.name).toBe('Prado');
		expect(starter.notes.last).toBe('Hiszpania');
	});

	it('falls back to nothing when a read fails', async () => {
		serve(
			query({ data: null, error: { message: 'failed' } }),
			query({ data: null, error: { message: 'failed' } })
		);

		await expect(loadPlaceStarter()).resolves.toEqual(emptyPlaceStarter());
	});
});
