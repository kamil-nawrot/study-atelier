import { ARTWORK_TYPE_CODES } from '#lib/catalogue/artwork-types/artwork-types.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
import type { FilterField } from '#lib/catalogue/types/filter-field.ts';
import type { MissingData } from '#lib/catalogue/types/missing-data.ts';
import { FILTER_FIELDS, MISSING_DATA, emptyFilter, hasYears } from '#lib/wall/filter/filter.ts';

const PARAMS: Record<FilterField, string> = {
	eras: 'era',
	types: 'type',
	years: 'year',
	authors: 'author',
	periods: 'period',
	styles: 'style',
	materials: 'material',
	locations: 'location',
	missing: 'missing',
	favourites: 'favourites'
};

type Params = Pick<URLSearchParams, 'get' | 'getAll' | 'has' | 'keys'>;

const UNKNOWN_AUTHOR_PARAM = 'unknown-author';
const OWN_PARAM_PREFIX = 'field.';
const OWN_TEXT_PARAM_PREFIX = 'text.';
const TICKED_PARAM = 'ticked';
const FLAG_ON = '1';
export const RANGE_SEPARATOR = '..';

export function yearsParam(from: number | null, to: number | null): string {
	return `${from ?? ''}${RANGE_SEPARATOR}${to ?? ''}`;
}

function parseYears(text: string): Pick<CollectionFilter, 'yearFrom' | 'yearTo'> {
	const [from, to] = text.split(RANGE_SEPARATOR);
	const parse = (part: string | undefined): number | null => {
		if (!part || !/^-?\d+$/.test(part)) return null;
		const year = Number(part);
		return Number.isSafeInteger(year) ? year : null;
	};
	return { yearFrom: parse(from), yearTo: parse(to) };
}

export function filterToParams(filter: CollectionFilter): URLSearchParams {
	const params = new URLSearchParams();
	for (const field of FILTER_FIELDS) {
		if (field === 'years') {
			if (hasYears(filter)) params.set(PARAMS.years, yearsParam(filter.yearFrom, filter.yearTo));
			continue;
		}
		if (field === 'favourites') {
			if (filter.favourites) params.set(PARAMS.favourites, FLAG_ON);
			continue;
		}
		for (const value of filter[field]) params.append(PARAMS[field], value);
	}
	for (const [id, values] of Object.entries(filter.own)) {
		for (const value of values) params.append(`${OWN_PARAM_PREFIX}${id}`, value);
	}
	for (const [id, text] of Object.entries(filter.ownTexts)) {
		if (text.trim()) params.set(`${OWN_TEXT_PARAM_PREFIX}${id}`, text);
	}
	for (const id of filter.ticked) params.append(TICKED_PARAM, id);
	if (filter.unknownAuthor) params.set(UNKNOWN_AUTHOR_PARAM, FLAG_ON);
	return params;
}

function uniqueValues(params: Params, name: string): string[] {
	return [...new Set(params.getAll(name).filter((value) => value !== ''))];
}

export function filterFromParams(params: Params): CollectionFilter {
	const years = params.get(PARAMS.years);
	return {
		...emptyFilter(),
		favourites: params.get(PARAMS.favourites) === FLAG_ON,
		eras: uniqueValues(params, PARAMS.eras).filter(isEraCode),
		types: uniqueValues(params, PARAMS.types).filter((value): value is ArtworkTypeCode =>
			ARTWORK_TYPE_CODES.includes(value as ArtworkTypeCode)
		),
		...(years ? parseYears(years) : {}),
		authors: uniqueValues(params, PARAMS.authors),
		unknownAuthor: params.get(UNKNOWN_AUTHOR_PARAM) === FLAG_ON,
		periods: uniqueValues(params, PARAMS.periods),
		styles: uniqueValues(params, PARAMS.styles),
		materials: uniqueValues(params, PARAMS.materials),
		locations: uniqueValues(params, PARAMS.locations),
		missing: uniqueValues(params, PARAMS.missing).filter((value): value is MissingData =>
			MISSING_DATA.includes(value as MissingData)
		),
		...ownFromParams(params)
	};
}

function ownFromParams(params: Params): Pick<CollectionFilter, 'own' | 'ownTexts' | 'ticked'> {
	const own: Record<string, string[]> = {};
	const ownTexts: Record<string, string> = {};
	for (const name of new Set(params.keys())) {
		if (name.startsWith(OWN_PARAM_PREFIX)) {
			own[name.slice(OWN_PARAM_PREFIX.length)] = uniqueValues(params, name);
		} else if (name.startsWith(OWN_TEXT_PARAM_PREFIX)) {
			ownTexts[name.slice(OWN_TEXT_PARAM_PREFIX.length)] = params.get(name) ?? '';
		}
	}
	return { own, ownTexts, ticked: uniqueValues(params, TICKED_PARAM) };
}
