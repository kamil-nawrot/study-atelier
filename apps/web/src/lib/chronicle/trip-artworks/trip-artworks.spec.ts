import { describe, expect, it } from 'vitest';
import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import type { Town } from '#lib/map/types/town.ts';
import { tripArtworks, tripPlaceNames } from './trip-artworks.ts';

const towns: Town[] = [
	{ name: 'Paryż', countryCode: 'FR', latitude: 48.857, longitude: 2.352 },
	{ name: 'Wersal', countryCode: 'FR', latitude: 48.805, longitude: 2.12 }
];

const places: TripPlace[] = [
	{ name: 'Paryż', placeType: 'city', point: { latitude: 48.857, longitude: 2.352 } },
	{
		name: 'Notre-Dame de Paris',
		placeType: 'on_site',
		point: { latitude: 48.853, longitude: 2.35 }
	},
	{ name: 'Louvre', placeType: 'museum', point: { latitude: 48.861, longitude: 2.336 } },
	{ name: 'Pałac Wersalski', placeType: 'on_site', point: { latitude: 48.805, longitude: 2.12 } }
];

describe('tripPlaceNames', () => {
	it('takes the city and the sites in it, but not its museums or other towns', () => {
		expect(tripPlaceNames('paryż', places, towns)).toEqual(
			new Set([valueKey('Paryż'), valueKey('Notre-Dame de Paris')])
		);
	});

	it('takes only the city when it has no point', () => {
		const unplaced = places.map((place) =>
			place.name === 'Paryż' ? { ...place, point: null } : place
		);

		expect(tripPlaceNames('Paryż', unplaced, towns)).toEqual(new Set([valueKey('Paryż')]));
	});

	it('takes nothing without a city', () => {
		expect(tripPlaceNames('  ', places, towns).size).toBe(0);
	});
});

describe('tripArtworks', () => {
	it('gives the artworks of the city and its sites', () => {
		const city = testArtwork(1, 'Le Marais', { location: 'Paryż' });
		const site = testArtwork(2, 'Rozeta', { location: 'Notre-Dame de Paris' });
		const museum = testArtwork(3, 'Mona Lisa', { location: 'Louvre' });
		const elsewhere = testArtwork(4, 'Bez miejsca', { location: null });

		expect(tripArtworks([city, site, museum, elsewhere], 'Paryż', places, towns)).toEqual([
			city,
			site
		]);
	});
});
