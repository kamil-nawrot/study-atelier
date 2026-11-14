import {
	sortRecords,
	type CardIndexSort
} from '#lib/card-index/card-index-sort/card-index-sort.ts';
import { valuesOf } from '#lib/card-index/card-index/card-index.ts';
import { countryName } from '#lib/catalogue/countries/countries.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { CardIndexCountry } from '#lib/card-index/types/card-index-country.ts';
import type { CardIndexPlace } from '#lib/card-index/types/card-index-place.ts';
import type { CardIndexPlaceGroup } from '#lib/card-index/types/card-index-place-group.ts';
import type { CardIndexPlaces } from '#lib/card-index/types/card-index-places.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';

function placeOf(record: CardIndexRecord): CardIndexPlace {
	return {
		id: record.id,
		name: record.name,
		count: record.count,
		...(record.placeType ? { placeType: record.placeType } : {})
	};
}

export function placesOfCity(data: CardIndexData, cityId: string): CardIndexPlace[] {
	return valuesOf(data, 'location')
		.filter((record) => record.cityId === cityId)
		.map(placeOf);
}

export function cityValueIds(data: CardIndexData, cityId: string): string[] {
	return [cityId, ...placesOfCity(data, cityId).map((place) => place.id)];
}

export function buildPlaceTree(data: CardIndexData): CardIndexPlaces {
	const records = valuesOf(data, 'location');
	const cities = new Set(
		records.filter((record) => record.placeType === 'city').map((record) => record.id)
	);
	const inCity = (record: CardIndexRecord): boolean =>
		record.cityId !== undefined && cities.has(record.cityId);

	const placesBy = new Map<string, CardIndexPlace[]>();
	for (const record of records.filter(inCity)) {
		const cityId = record.cityId as string;
		placesBy.set(cityId, [...(placesBy.get(cityId) ?? []), placeOf(record)]);
	}

	const byCountry = new Map<string, CardIndexPlaceGroup[]>();
	const withoutCountry: CardIndexPlaceGroup[] = [];
	for (const record of records.filter((place) => !inCity(place))) {
		const places = placesBy.get(record.id) ?? [];
		const group = {
			...placeOf(record),
			count: places.reduce((sum, place) => sum + place.count, record.count),
			city: cities.has(record.id),
			places
		};
		const code = record.countryCode;
		if (code) byCountry.set(code, [...(byCountry.get(code) ?? []), group]);
		else withoutCountry.push(group);
	}

	return {
		countries: [...byCountry].map(([code, groups]) => ({
			code,
			name: countryName(code),
			count: groups.reduce((sum, group) => sum + group.count, 0),
			groups
		})),
		withoutCountry
	};
}

function narrowGroups(
	groups: CardIndexPlaceGroup[],
	term: string,
	sort: CardIndexSort
): CardIndexPlaceGroup[] {
	const matches = (place: CardIndexPlace): boolean => normalizeForSearch(place.name).includes(term);
	return sortRecords(
		groups.flatMap((group) => {
			const found = !term || matches(group);
			const places = sortRecords(found ? group.places : group.places.filter(matches), sort);
			return found || places.length > 0 ? [{ ...group, places }] : [];
		}),
		sort
	);
}

export function narrowPlaceTree(
	tree: CardIndexPlaces,
	query: string,
	sort: CardIndexSort
): CardIndexPlaces {
	const term = normalizeForSearch(query);
	const countries = tree.countries.flatMap((country): CardIndexCountry[] => {
		const named = term !== '' && normalizeForSearch(country.name).includes(term);
		const groups = narrowGroups(country.groups, named ? '' : term, sort);
		return groups.length > 0 ? [{ ...country, groups }] : [];
	});
	return {
		countries: sortRecords(countries, sort),
		withoutCountry: narrowGroups(tree.withoutCountry, term, sort)
	};
}

export function citiesWithMatchingPlaces(tree: CardIndexPlaces, query: string): string[] {
	const term = normalizeForSearch(query);
	if (!term) return [];
	return [...tree.countries.flatMap((country) => country.groups), ...tree.withoutCountry]
		.filter((group) => group.places.some((place) => normalizeForSearch(place.name).includes(term)))
		.map((group) => group.id);
}

export function cityIds(tree: CardIndexPlaces): string[] {
	return [...tree.countries.flatMap((country) => country.groups), ...tree.withoutCountry]
		.filter((group) => group.city)
		.map((group) => group.id);
}

export const PLACE_FOLDING_KEYS = {
	folded: 'study-atelier:card-index-folded-countries',
	open: 'study-atelier:card-index-open-cities'
};
