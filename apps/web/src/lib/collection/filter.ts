import { ARTWORK_TYPE_CODES } from './artwork-types.ts';
import { ERA_CODES, eraName, isEraCode } from './eras.ts';
import { m } from '#lib/i18n/index.ts';
import type {
	ArtworkTypeCode,
	CollectionFilter,
	EraCode,
	FilterField,
	FilterOption,
	FilterTag,
	MissingData,
	TagParts,
	WallArtwork
} from './types.ts';

export const UNKNOWN_AUTHOR = '';

export const FILTER_FIELDS: readonly FilterField[] = [
	'favourites',
	'eras',
	'types',
	'years',
	'authors',
	'periods',
	'styles',
	'materials',
	'locations',
	'missing'
];

export const MISSING_DATA: readonly MissingData[] = ['image', 'year', 'era', 'period', 'type'];

type ValueField = Exclude<FilterField, 'years' | 'favourites'>;

const NAME_FIELDS = ['authors', 'periods', 'styles', 'materials', 'locations'] as const;

const PARAMS: Record<FilterField, string> = {
	eras: 'epoka',
	types: 'typ',
	years: 'rok',
	authors: 'autor',
	periods: 'okres',
	styles: 'styl',
	materials: 'material',
	locations: 'miejsce',
	missing: 'braki',
	favourites: 'ulubione'
};

type Params = Pick<URLSearchParams, 'get' | 'getAll' | 'has'>;

const UNKNOWN_AUTHOR_PARAM = 'bez-autora';
const RANGE_SEPARATOR = '..';

export function emptyFilter(): CollectionFilter {
	return {
		favourites: false,
		eras: [],
		types: [],
		yearFrom: null,
		yearTo: null,
		authors: [],
		unknownAuthor: false,
		periods: [],
		styles: [],
		materials: [],
		locations: [],
		missing: []
	};
}

function hasYears(filter: CollectionFilter): boolean {
	return filter.yearFrom !== null || filter.yearTo !== null;
}

function hasChoice(filter: CollectionFilter, field: FilterField): boolean {
	if (field === 'years') return hasYears(filter);
	if (field === 'favourites') return filter.favourites;
	if (field === 'authors') return filter.authors.length > 0 || filter.unknownAuthor;
	return filter[field].length > 0;
}

export function isEmptyFilter(filter: CollectionFilter): boolean {
	return FILTER_FIELDS.every((field) => !hasChoice(filter, field));
}

function missingOf(artwork: WallArtwork): MissingData[] {
	return MISSING_DATA.filter((kind) => {
		if (kind === 'image') return !artwork.hasImage;
		if (kind === 'year') return artwork.yearTo === null;
		if (kind === 'era') return artwork.eraCode === null;
		if (kind === 'period') return artwork.period === null;
		return artwork.typeCode === null;
	});
}

function valuesOf(artwork: WallArtwork, field: ValueField): string[] {
	if (field === 'eras') return artwork.eraCode ? [artwork.eraCode] : [];
	if (field === 'types') return artwork.typeCode ? [artwork.typeCode] : [];
	if (field === 'authors') return artwork.authors.length > 0 ? artwork.authors : [UNKNOWN_AUTHOR];
	if (field === 'periods') return artwork.period ? [artwork.period] : [];
	if (field === 'styles') return artwork.styles;
	if (field === 'materials') return artwork.materials;
	if (field === 'locations') return artwork.location ? [artwork.location] : [];
	return missingOf(artwork);
}

function chosenValues(filter: CollectionFilter, field: ValueField): string[] {
	if (field === 'authors')
		return filter.unknownAuthor ? [...filter.authors, UNKNOWN_AUTHOR] : filter.authors;
	return filter[field];
}

function fieldMatches(artwork: WallArtwork, filter: CollectionFilter, field: FilterField): boolean {
	if (field === 'favourites') return artwork.favourite;
	if (field === 'years') {
		if (artwork.yearTo === null) return false;
		if (filter.yearFrom !== null && artwork.yearTo < filter.yearFrom) return false;
		return filter.yearTo === null || (artwork.yearFrom ?? artwork.yearTo) <= filter.yearTo;
	}
	const chosen = chosenValues(filter, field);
	return valuesOf(artwork, field).some((value) => chosen.includes(value));
}

export function matchesFilter(
	artwork: WallArtwork,
	filter: CollectionFilter,
	skip?: FilterField
): boolean {
	return FILTER_FIELDS.every(
		(field) => field === skip || !hasChoice(filter, field) || fieldMatches(artwork, filter, field)
	);
}

export function applyFilter(artworks: WallArtwork[], filter: CollectionFilter): WallArtwork[] {
	return isEmptyFilter(filter)
		? artworks
		: artworks.filter((artwork) => matchesFilter(artwork, filter));
}

const NAME_COLLATOR = new Intl.Collator('pl');

function fixedOrder(field: ValueField): readonly string[] | undefined {
	if (field === 'eras') return ERA_CODES;
	if (field === 'types') return ARTWORK_TYPE_CODES;
	if (field === 'missing') return MISSING_DATA;
	return undefined;
}

export function filterOptions(
	artworks: WallArtwork[],
	filter: CollectionFilter,
	field: ValueField
): FilterOption[] {
	const counts = new Map<string, number>();
	for (const artwork of artworks) {
		if (!matchesFilter(artwork, filter, field)) continue;
		for (const value of valuesOf(artwork, field)) counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	for (const value of chosenValues(filter, field)) counts.set(value, counts.get(value) ?? 0);

	const options = [...counts].map(([value, count]) => ({ value, count }));
	const order = fixedOrder(field);
	if (order) return options.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
	return options.sort((a, b) => {
		if (a.value === UNKNOWN_AUTHOR) return 1;
		if (b.value === UNKNOWN_AUTHOR) return -1;
		return b.count - a.count || NAME_COLLATOR.compare(a.value, b.value);
	});
}

export function favouriteCount(artworks: WallArtwork[], filter: CollectionFilter): number {
	return artworks.filter(
		(artwork) => artwork.favourite && matchesFilter(artwork, filter, 'favourites')
	).length;
}

export function toggleFavourites(filter: CollectionFilter): CollectionFilter {
	return { ...filter, favourites: !filter.favourites };
}

export function onlyFavourites(filter: CollectionFilter): boolean {
	return (
		filter.favourites &&
		FILTER_FIELDS.every((field) => field === 'favourites' || !hasChoice(filter, field))
	);
}

export function toggleValue(
	filter: CollectionFilter,
	field: ValueField,
	value: string
): CollectionFilter {
	if (field === 'authors' && value === UNKNOWN_AUTHOR)
		return { ...filter, unknownAuthor: !filter.unknownAuthor };
	const current: string[] = filter[field];
	const next = current.includes(value)
		? current.filter((item) => item !== value)
		: [...current, value];
	return { ...filter, [field]: next };
}

export function setYears(
	filter: CollectionFilter,
	yearFrom: number | null,
	yearTo: number | null
): CollectionFilter {
	return { ...filter, yearFrom, yearTo };
}

export function clearField(filter: CollectionFilter, field: FilterField): CollectionFilter {
	const empty = emptyFilter();
	if (field === 'years') return { ...filter, yearFrom: null, yearTo: null };
	if (field === 'authors') return { ...filter, authors: [], unknownAuthor: false };
	if (field === 'favourites') return { ...filter, favourites: false };
	return { ...filter, [field]: empty[field] };
}

export function filterTags(filter: CollectionFilter): FilterTag[] {
	const tags: FilterTag[] = [];
	for (const field of FILTER_FIELDS) {
		if (field === 'years') {
			if (hasYears(filter))
				tags.push({ id: 'years', field, value: yearsParam(filter.yearFrom, filter.yearTo) });
			continue;
		}
		if (field === 'favourites') {
			if (filter.favourites) tags.push({ id: 'favourites', field, value: '' });
			continue;
		}
		for (const value of chosenValues(filter, field))
			tags.push({ id: `${field}:${value}`, field, value });
	}
	return tags;
}

export function removeTag(filter: CollectionFilter, tag: FilterTag): CollectionFilter {
	if (tag.field === 'years' || tag.field === 'favourites') return clearField(filter, tag.field);
	return toggleValue(filter, tag.field, tag.value);
}

export function optionLabel(field: ValueField, value: string): string {
	if (field === 'eras') return eraName(value as EraCode);
	if (field === 'types') return m.artworkTypes[value as ArtworkTypeCode];
	if (field === 'missing') return m.atelier.filters.missing[value as MissingData];
	return value === UNKNOWN_AUTHOR ? m.atelier.filters.unknownAuthor : value;
}

export function tagParts(tag: FilterTag): TagParts {
	const field = m.atelier.filters.tagFields[tag.field];
	if (tag.field === 'favourites') return { field, value: '' };
	if (tag.field !== 'years') return { field, value: optionLabel(tag.field, tag.value) };
	const [from, to] = tag.value.split(RANGE_SEPARATOR).map((part) => (part ? Number(part) : null));
	return { field, value: yearsLabel(from, to) };
}

export function tagLabel(tag: FilterTag): string {
	const { field, value } = tagParts(tag);
	return value ? m.atelier.filters.tag(field, value) : field;
}

function yearsLabel(from: number | null, to: number | null): string {
	if (from !== null && to !== null) return m.atelier.filters.yearsBetween(from, to);
	if (from !== null) return m.atelier.filters.yearsFrom(from);
	return m.atelier.filters.yearsTo(to as number);
}

function yearsParam(from: number | null, to: number | null): string {
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
			if (filter.favourites) params.set(PARAMS.favourites, '1');
			continue;
		}
		for (const value of filter[field]) params.append(PARAMS[field], value);
	}
	if (filter.unknownAuthor) params.set(UNKNOWN_AUTHOR_PARAM, '1');
	return params;
}

function uniqueValues(params: Params, name: string): string[] {
	return [...new Set(params.getAll(name).filter((value) => value !== ''))];
}

export function filterFromParams(params: Params): CollectionFilter {
	const years = params.get(PARAMS.years);
	return {
		...emptyFilter(),
		favourites: params.has(PARAMS.favourites),
		eras: uniqueValues(params, PARAMS.eras).filter(isEraCode),
		types: uniqueValues(params, PARAMS.types).filter((value): value is ArtworkTypeCode =>
			ARTWORK_TYPE_CODES.includes(value as ArtworkTypeCode)
		),
		...(years ? parseYears(years) : {}),
		authors: uniqueValues(params, PARAMS.authors),
		unknownAuthor: params.has(UNKNOWN_AUTHOR_PARAM),
		periods: uniqueValues(params, PARAMS.periods),
		styles: uniqueValues(params, PARAMS.styles),
		materials: uniqueValues(params, PARAMS.materials),
		locations: uniqueValues(params, PARAMS.locations),
		missing: uniqueValues(params, PARAMS.missing).filter((value): value is MissingData =>
			MISSING_DATA.includes(value as MissingData)
		)
	};
}

export function pruneFilter(filter: CollectionFilter, artworks: WallArtwork[]): CollectionFilter {
	const pruned = { ...filter };
	for (const field of NAME_FIELDS) {
		const existing = new Set(artworks.flatMap((artwork) => valuesOf(artwork, field)));
		pruned[field] = filter[field].filter((value) => existing.has(value));
	}
	return pruned;
}
