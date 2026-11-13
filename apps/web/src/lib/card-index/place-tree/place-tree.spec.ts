import { describe, expect, it } from 'vitest';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import {
	buildPlaceTree,
	citiesWithMatchingPlaces,
	cityIds,
	cityValueIds,
	narrowPlaceTree,
	placesOfCity
} from './place-tree.ts';

function place(
	id: string,
	name: string,
	count: number,
	extra: Partial<CardIndexRecord> = {}
): CardIndexRecord {
	return { id, category: 'location', name, count, ...extra };
}

function index(): CardIndexData {
	return {
		values: [
			place('paris', 'Paryż', 1, { placeType: 'city', countryCode: 'FR' }),
			place('louvre', 'Luwr', 2, { placeType: 'museum', countryCode: 'FR', cityId: 'paris' }),
			place('orsay', "Musée d'Orsay", 13, {
				placeType: 'museum',
				countryCode: 'FR',
				cityId: 'paris'
			}),
			place('lascaux', 'Lascaux', 1, { placeType: 'on_site', countryCode: 'FR' }),
			place('rome', 'Rzym', 9, { placeType: 'city', countryCode: 'IT' }),
			place('tum', 'Tum', 0, { placeType: 'city' }),
			place('collegiate', 'Kolegiata', 1, { placeType: 'on_site', cityId: 'tum' }),
			place('hall', 'Hall VIII', 1),
			{ id: 'marble', category: 'material', name: 'Marmur', count: 3 }
		],
		periodEras: [],
		stylePeriods: []
	};
}

describe('buildPlaceTree', () => {
	it('groups places by country and city and counts every artwork of a city', () => {
		const tree = buildPlaceTree(index());

		expect(tree.countries.map((country) => [country.code, country.count])).toEqual([
			['FR', 17],
			['IT', 9]
		]);
		const france = tree.countries[0];
		expect(france.groups.map((group) => [group.name, group.city, group.count])).toEqual([
			['Lascaux', false, 1],
			['Paryż', true, 16]
		]);
		expect(france.groups[1].places.map((entry) => entry.name)).toEqual(['Luwr', "Musée d'Orsay"]);
	});

	it('keeps places with neither a country nor a city and cities without a country apart', () => {
		const tree = buildPlaceTree(index());

		expect(tree.withoutCountry.map((group) => [group.name, group.places.length])).toEqual([
			['Hall VIII', 0],
			['Tum', 1]
		]);
	});
});

describe('narrowPlaceTree', () => {
	it('sorts every level by the count of artworks', () => {
		const tree = narrowPlaceTree(buildPlaceTree(index()), '', 'count');

		expect(tree.countries.map((country) => country.code)).toEqual(['FR', 'IT']);
		expect(tree.countries[0].groups.map((group) => group.name)).toEqual(['Paryż', 'Lascaux']);
		expect(tree.countries[0].groups[0].places.map((entry) => entry.name)).toEqual([
			"Musée d'Orsay",
			'Luwr'
		]);
	});

	it('shows a place found by the search with its country and city', () => {
		const full = buildPlaceTree(index());
		const tree = narrowPlaceTree(full, 'orsay', 'name');

		expect(tree.countries.map((country) => country.code)).toEqual(['FR']);
		expect(tree.countries[0].groups.map((group) => group.name)).toEqual(['Paryż']);
		expect(tree.countries[0].groups[0].places.map((entry) => entry.name)).toEqual([
			"Musée d'Orsay"
		]);
		expect(citiesWithMatchingPlaces(tree, 'orsay')).toEqual(['paris']);
		expect(tree.withoutCountry).toEqual([]);
	});

	it('shows the whole country when its name matches', () => {
		const tree = narrowPlaceTree(buildPlaceTree(index()), 'francja', 'name');

		expect(tree.countries[0].groups.map((group) => group.name)).toEqual(['Lascaux', 'Paryż']);
		expect(tree.countries[0].groups[1].places).toHaveLength(2);
	});
});

describe('places of a city', () => {
	it('lists the places of a city and the ids of the city with them', () => {
		expect(placesOfCity(index(), 'paris').map((entry) => entry.id)).toEqual(['louvre', 'orsay']);
		expect(cityValueIds(index(), 'paris')).toEqual(['paris', 'louvre', 'orsay']);
		expect(cityValueIds(index(), 'lascaux')).toEqual(['lascaux']);
		expect(cityIds(buildPlaceTree(index()))).toEqual(['paris', 'rome', 'tum']);
	});
});
