import { describe, expect, it } from 'vitest';
import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import { cityKey, tripArtworks, tripPlaceNames } from './trip-artworks.ts';

function place(name: string, overrides: Partial<TripPlace> = {}): TripPlace {
	return {
		id: valueKey(name),
		name,
		placeType: null,
		countryCode: null,
		point: null,
		cityId: null,
		...overrides
	};
}

const places: TripPlace[] = [
	place('Paryż', { placeType: 'city' }),
	place('Notre-Dame de Paris', { placeType: 'on_site', cityId: valueKey('Paryż') }),
	place('Louvre', { placeType: 'museum', cityId: valueKey('Paryż') }),
	place('Wersal', { placeType: 'city' }),
	place('Pałac Wersalski', { placeType: 'on_site', cityId: valueKey('Wersal') }),
	place('Lascaux', { placeType: 'on_site', point: { latitude: 45.05, longitude: 1.17 } })
];

describe('cityKey', () => {
	it('is the place itself for a city and its stored city for any other place', () => {
		expect(cityKey(places[0])).toBe(valueKey('Paryż'));
		expect(cityKey(places[2])).toBe(valueKey('Paryż'));
		expect(cityKey(places[5])).toBeNull();
	});
});

describe('tripPlaceNames', () => {
	it('takes the city and the sites with that city, but not its museums or other towns', () => {
		expect(tripPlaceNames('paryż', places)).toEqual(
			new Set([valueKey('Paryż'), valueKey('Notre-Dame de Paris')])
		);
	});

	it('takes only the name when the atelier does not know the city', () => {
		expect(tripPlaceNames('Kraków', places)).toEqual(new Set([valueKey('Kraków')]));
	});

	it('takes nothing without a city', () => {
		expect(tripPlaceNames('  ', places).size).toBe(0);
	});
});

describe('tripArtworks', () => {
	it('gives the artworks of the city and its sites', () => {
		const city = testArtwork(1, 'Le Marais', { location: 'Paryż' });
		const site = testArtwork(2, 'Rozeta', { location: 'Notre-Dame de Paris' });
		const museum = testArtwork(3, 'Mona Lisa', { location: 'Louvre' });
		const elsewhere = testArtwork(4, 'Bez miejsca', { location: null });

		expect(tripArtworks([city, site, museum, elsewhere], 'Paryż', places)).toEqual([city, site]);
	});
});
