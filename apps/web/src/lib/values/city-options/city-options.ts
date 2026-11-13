import type { ValueOption } from '@study-atelier/ui';
import { countryName, isCountryCode } from '#lib/catalogue/countries/countries.ts';
import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import { namesakeRegion, searchTowns } from '#lib/map/town-search/town-search.ts';
import { locale } from '#lib/i18n/i18n.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { Town } from '#lib/map/types/town.ts';
import type { PlaceCity } from '#lib/values/types/place-city.ts';

const OWN_LIMIT = 8;
const TOWN_MIN_QUERY = 2;

export type CityOptions = {
	options: ValueOption[];
	choices: Map<string, PlaceCity>;
};

export function ownCities(values: readonly CardIndexRecord[], placeId?: string): CardIndexRecord[] {
	return values
		.filter(
			(value) => value.category === 'location' && value.placeType === 'city' && value.id !== placeId
		)
		.sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function cityOfTown(town: Town): PlaceCity {
	return {
		name: town.name,
		countryCode: isCountryCode(town.countryCode) ? town.countryCode : null,
		point: { latitude: town.latitude, longitude: town.longitude },
		wikidataId: town.wikidataId ?? null
	};
}

function townNote(town: Town, shown: readonly Town[]): string | undefined {
	const country = isCountryCode(town.countryCode) ? countryName(town.countryCode) : null;
	return [namesakeRegion(town, shown), country].filter(Boolean).join(', ') || undefined;
}

function cityNote(city: CardIndexRecord): string | undefined {
	return isCountryCode(city.countryCode) ? countryName(city.countryCode) : undefined;
}

export function cityOptions(
	query: string,
	cities: readonly CardIndexRecord[],
	towns: readonly Town[]
): CityOptions {
	const key = valueKey(query);
	const choices = new Map<string, PlaceCity>();
	const own = cities.filter((city) => valueKey(city.name).includes(key)).slice(0, OWN_LIMIT);
	const known = new Set(cities.map((city) => valueKey(city.name)));
	const shown =
		key.length >= TOWN_MIN_QUERY
			? searchTowns(query, towns).filter((town) => !known.has(valueKey(town.name)))
			: [];
	const options: ValueOption[] = [
		...own.map((city) => {
			choices.set(city.id, {
				id: city.id,
				name: city.name,
				countryCode: city.countryCode ?? null
			});
			return { kind: 'existing' as const, id: city.id, name: city.name, note: cityNote(city) };
		}),
		...shown.map((town, index) => {
			const id = `town-${index}`;
			choices.set(id, cityOfTown(town));
			return { kind: 'starter' as const, id, name: town.name, note: townNote(town, shown) };
		})
	];
	const name = query.trim();
	if (name && !known.has(key) && !shown.some((town) => valueKey(town.name) === key)) {
		choices.set('new', { name });
		options.push({ kind: 'new', id: 'new', name });
	}
	return { options, choices };
}
