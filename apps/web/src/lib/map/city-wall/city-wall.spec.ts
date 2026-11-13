import { describe, expect, it } from 'vitest';
import { testPlace } from '#lib/testing/map/map.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import { cityWallHref } from './city-wall.ts';

const city: MapCity = {
	key: 'FR:Paryż',
	cityId: null,
	name: 'Paryż',
	countryCode: 'FR',
	point: { latitude: 48.857, longitude: 2.35 },
	places: [
		{ place: testPlace('Louvre'), artworks: [] },
		{ place: testPlace("Musée d'Orsay"), artworks: [] }
	],
	count: 2,
	seen: 0
};

describe('cityWallHref', () => {
	it('opens the wall filtered by the places of the city', () => {
		const url = new URL(cityWallHref(city, 'all'), 'https://example.test');

		expect(url.pathname).toBe('/atelier');
		expect(url.searchParams.getAll('location')).toEqual(['Louvre', "Musée d'Orsay"]);
		expect(url.searchParams.has('want-to-see')).toBe(false);
	});

	it('keeps the filter of the map', () => {
		expect(
			new URL(cityWallHref(city, 'wantToSee'), 'https://example.test').searchParams.get(
				'want-to-see'
			)
		).toBe('1');
		expect(
			new URL(cityWallHref(city, 'seen'), 'https://example.test').searchParams.get('seen')
		).toBe('1');
	});
});
