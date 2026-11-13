import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testGeography, testPlace } from '#lib/testing/map/map.ts';
import { filterCounts, mapCities, placesToFill } from './map-cities.ts';

const towns = testGeography().towns;
const louvre = testPlace('Louvre', { point: { latitude: 48.86111, longitude: 2.33583 } });
const orsay = testPlace("Musée d'Orsay", { point: { latitude: 48.86, longitude: 2.3266 } });
const uffizi = testPlace('Uffizi', { point: { latitude: 43.76778, longitude: 11.25528 } });
const moma = testPlace('MoMA', {
	countryCode: 'US',
	point: { latitude: 40.76139, longitude: -73.97778 }
});
const belvedere = testPlace('Belvedere');

const artworks = [
	testArtwork(1, 'Mona Lisa', { location: 'Louvre', seen: true }),
	testArtwork(2, 'Olympia', { location: "Musée d'Orsay", wantToSee: true }),
	testArtwork(3, 'Primavera', { location: 'Uffizi', wantToSee: true }),
	testArtwork(4, 'Birth of Venus', { location: 'Uffizi' }),
	testArtwork(5, 'The Starry Night', { location: 'MoMA, New York' }),
	testArtwork(6, 'The Kiss', { location: 'Belvedere' }),
	testArtwork(7, 'Untitled')
];

describe('mapCities', () => {
	it('groups the places of one town into a city with its counts, most artworks first', () => {
		const cities = mapCities([louvre, orsay, uffizi, belvedere], artworks, towns, 'all');

		expect(cities.map((city) => [city.name, city.count, city.seen])).toEqual([
			['Paryż', 2, 1],
			['Florencja', 2, 0]
		]);
		expect(cities[0]).toMatchObject({ key: 'FR:Paryż', countryCode: 'FR' });
		expect(cities[0].point).toEqual({ latitude: 48.857, longitude: 2.35 });
		expect(cities[0].places.map(({ place }) => place.name)).toEqual(['Louvre', "Musée d'Orsay"]);
	});

	it('names a place far from every town after the part of its name before a comma', () => {
		const place = { ...moma, name: 'MoMA, New York' };

		const [city] = mapCities([place], artworks, towns, 'all');

		expect(city).toMatchObject({ key: `place:${place.id}`, name: 'MoMA', countryCode: 'US' });
		expect(city.point).toEqual(place.point);
	});

	it('narrows the cities to the artworks the filter names', () => {
		expect(mapCities([louvre, orsay, uffizi], artworks, towns, 'wantToSee')).toMatchObject([
			{ name: 'Paryż', count: 1 },
			{ name: 'Florencja', count: 1 }
		]);
		expect(mapCities([louvre, orsay, uffizi], artworks, towns, 'seen')).toMatchObject([
			{ name: 'Paryż', count: 1, seen: 1 }
		]);
	});
});

describe('filterCounts', () => {
	it('counts only the artworks at places with a point', () => {
		expect(filterCounts([louvre, orsay, uffizi, belvedere], artworks)).toEqual({
			all: 4,
			wantToSee: 2,
			seen: 1
		});
	});
});

describe('placesToFill', () => {
	it('lists the places without a point that hold artworks, most artworks first', () => {
		const rome = testPlace('Rzym');
		const lonely = testPlace('Empty place');
		const list = placesToFill(
			[louvre, belvedere, rome, lonely],
			[
				...artworks,
				testArtwork(8, 'Pieta', { location: 'Rzym' }),
				testArtwork(9, 'Moses', { location: 'Rzym' })
			]
		);

		expect(list.map(({ place, count }) => [place.name, count])).toEqual([
			['Rzym', 2],
			['Belvedere', 1]
		]);
	});
});
