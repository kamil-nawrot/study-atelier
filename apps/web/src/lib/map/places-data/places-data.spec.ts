import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadMapPlaces, mapPlaceOf, setPlacePoint } from './places-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));

const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn() };

describe('places data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.select.mockReturnValue(query);
		query.eq.mockReturnValue(query);
		query.order.mockReturnValue(query);
	});

	it('reads the places with their type, country and point', async () => {
		query.range.mockResolvedValue({
			data: [
				{
					id: 'place-1',
					name: 'Louvre',
					location_details: {
						place_type: 'museum',
						country_code: 'FR',
						latitude: 48.86,
						longitude: 2.34
					}
				},
				{ id: 'place-2', name: 'Rzym', location_details: [] }
			],
			error: null
		});

		await expect(loadMapPlaces()).resolves.toEqual({
			places: [
				{
					id: 'place-1',
					name: 'Louvre',
					placeType: 'museum',
					countryCode: 'FR',
					point: { latitude: 48.86, longitude: 2.34 },
					cityId: null
				},
				{
					id: 'place-2',
					name: 'Rzym',
					placeType: null,
					countryCode: null,
					point: null,
					cityId: null
				}
			]
		});
		expect(supabase.from).toHaveBeenCalledWith('category_values');
		expect(query.eq).toHaveBeenCalledWith('category_code', 'location');
		expect(query.range).toHaveBeenCalledWith(0, 999);
	});

	it('says the map could not load when the query fails', async () => {
		query.range.mockResolvedValue({ data: null, error: { message: 'TypeError: Failed to fetch' } });

		await expect(loadMapPlaces()).resolves.toEqual({ places: [], error: m.map.loadError });
	});

	it('ignores a type and a country it does not know', () => {
		expect(
			mapPlaceOf({
				id: 'place-3',
				name: 'Somewhere',
				location_details: [
					{ place_type: 'castle', country_code: 'XX', latitude: null, longitude: 1 }
				]
			})
		).toMatchObject({ placeType: null, countryCode: null, point: null });
	});

	it('reads the stored city of a place', () => {
		expect(
			mapPlaceOf({
				id: 'place-4',
				name: 'Louvre',
				location_details: {
					place_type: 'museum',
					country_code: 'FR',
					latitude: null,
					longitude: null,
					city_id: 'place-paris'
				}
			})
		).toMatchObject({ cityId: 'place-paris', point: null });
	});

	it('sets and removes the point of a place in one call', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

		await expect(
			setPlacePoint('place-1', { latitude: 41.9, longitude: 12.5 }, 'Q220')
		).resolves.toEqual({});
		expect(supabase.rpc).toHaveBeenCalledWith('set_place_point', {
			place: 'place-1',
			latitude: 41.9,
			longitude: 12.5,
			wikidata_id: 'Q220'
		});

		await setPlacePoint('place-1', null);
		expect(supabase.rpc).toHaveBeenLastCalledWith('set_place_point', {
			place: 'place-1',
			latitude: null,
			longitude: null
		});
	});

	it('returns the message to show when saving fails', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ error: { message: 'boom' } } as never);

		await expect(setPlacePoint('place-1', null)).resolves.toEqual({ error: m.map.saveFailed });
	});
});
