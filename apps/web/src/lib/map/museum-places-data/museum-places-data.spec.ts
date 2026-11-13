import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { loadMuseumPlaces } from './museum-places-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

function answer(result: { data: unknown; error: unknown }): void {
	const range = vi.fn().mockResolvedValue(result);
	const order = vi.fn(() => ({ range }));
	const select = vi.fn(() => ({ order }));
	vi.mocked(supabase.from).mockReturnValue({ select } as never);
}

describe('loadMuseumPlaces', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		forgetCached();
	});

	it('reads the museums of the catalogue with their points', async () => {
		answer({
			data: [
				{
					wikidata_id: 'Q1',
					name: 'Galeria Bitew w Wersalu',
					alias: 'Gallery of Battles',
					country_code: 'FR',
					latitude: 48.8,
					longitude: 2.1
				}
			],
			error: null
		});

		expect(await loadMuseumPlaces()).toEqual([
			{
				wikidataId: 'Q1',
				name: 'Galeria Bitew w Wersalu',
				alias: 'Gallery of Battles',
				countryCode: 'FR',
				point: { latitude: 48.8, longitude: 2.1 }
			}
		]);
	});

	it('gives no museums when the catalogue cannot be read', async () => {
		answer({ data: null, error: { message: 'offline' } });

		expect(await loadMuseumPlaces()).toEqual([]);
	});
});
