import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testPlace } from '#lib/testing/map/map.ts';
import { filterCounts, mapCities, onMap } from './map-cities.ts';

const paris = testPlace('Paryż', {
	placeType: 'city',
	countryCode: 'FR',
	point: { latitude: 48.857, longitude: 2.35 }
});
const florence = testPlace('Florencja', {
	placeType: 'city',
	countryCode: 'IT',
	point: { latitude: 43.78, longitude: 11.25 }
});
const louvre = testPlace('Louvre', { cityId: paris.id, countryCode: 'FR' });
const orsay = testPlace("Musée d'Orsay", { cityId: paris.id, countryCode: 'FR' });
const uffizi = testPlace('Uffizi', { cityId: florence.id, countryCode: 'IT' });
const lascaux = testPlace('Lascaux, Francja', {
	placeType: 'on_site',
	countryCode: 'FR',
	point: { latitude: 45.05, longitude: 1.17 }
});
const tum = testPlace('Tum', { placeType: 'city' });
const collegiate = testPlace('Kolegiata', { cityId: tum.id });
const belvedere = testPlace('Belvedere');
const places = [paris, florence, louvre, orsay, uffizi, lascaux, tum, collegiate, belvedere];

const artworks = [
	testArtwork(1, 'Mona Lisa', { location: 'Louvre', seen: true }),
	testArtwork(2, 'Olympia', { location: "Musée d'Orsay", wantToSee: true }),
	testArtwork(3, 'Primavera', { location: 'Uffizi', wantToSee: true }),
	testArtwork(4, 'Birth of Venus', { location: 'Uffizi' }),
	testArtwork(5, 'Bull', { location: 'Lascaux, Francja' }),
	testArtwork(6, 'Paris street', { location: 'Paryż' }),
	testArtwork(7, 'Portal', { location: 'Kolegiata' }),
	testArtwork(8, 'The Kiss', { location: 'Belvedere' }),
	testArtwork(9, 'Untitled')
];

describe('mapCities', () => {
	it('groups places by their stored city at the point of the city, most artworks first', () => {
		const cities = mapCities(places, artworks, 'all');

		expect(cities.map((city) => [city.name, city.count, city.seen])).toEqual([
			['Paryż', 3, 1],
			['Florencja', 2, 0],
			['Lascaux', 1, 0]
		]);
		expect(cities[0]).toMatchObject({
			key: `city:${paris.id}`,
			cityId: paris.id,
			countryCode: 'FR',
			point: paris.point
		});
		expect(cities[0].places.map(({ place }) => place.name)).toEqual([
			'Paryż',
			'Louvre',
			"Musée d'Orsay"
		]);
	});

	it('draws a place without a city at its own point, named before the comma', () => {
		const lonely = mapCities(places, artworks, 'all').find((city) => city.key.startsWith('place:'));

		expect(lonely).toMatchObject({
			key: `place:${lascaux.id}`,
			cityId: null,
			name: 'Lascaux',
			point: lascaux.point
		});
	});

	it('leaves out places whose city has no position and places with neither', () => {
		const names = mapCities(places, artworks, 'all').flatMap((city) =>
			city.places.map(({ place }) => place.name)
		);

		expect(names).not.toContain('Kolegiata');
		expect(names).not.toContain('Belvedere');
	});

	it('narrows the cities to the artworks the filter names', () => {
		expect(mapCities(places, artworks, 'wantToSee')).toMatchObject([
			{ name: 'Paryż', count: 1 },
			{ name: 'Florencja', count: 1 }
		]);
		expect(mapCities(places, artworks, 'seen')).toMatchObject([
			{ name: 'Paryż', count: 1, seen: 1 }
		]);
	});
});

describe('onMap', () => {
	it('names the places that reach the map through their city or their own point', () => {
		expect([...onMap(places)].sort()).toEqual(
			['Florencja', 'Lascaux, Francja', 'Louvre', "Musée d'Orsay", 'Paryż', 'Uffizi'].sort()
		);
	});
});

describe('filterCounts', () => {
	it('counts only the artworks at places on the map', () => {
		expect(filterCounts(places, artworks)).toEqual({ all: 6, wantToSee: 2, seen: 1 });
	});
});
