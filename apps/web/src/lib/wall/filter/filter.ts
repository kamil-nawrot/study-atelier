import { ARTWORK_TYPE_CODES } from '#lib/catalogue/artwork-types/artwork-types.ts';
import { authorSortKeys, sortKeyOf } from '#lib/catalogue/author-sort/author-sort.ts';
import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
import type { FilterField } from '#lib/catalogue/types/filter-field.ts';
import type { FilterOption } from '#lib/catalogue/types/filter-option.ts';
import type { MissingData } from '#lib/catalogue/types/missing-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { FilterValueField } from '#lib/wall/types/filter-value-field.ts';

type FilterSkip = FilterField | `own:${string}` | `ownText:${string}` | 'ticked';

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
		missing: [],
		own: {},
		ownTexts: {},
		ticked: []
	};
}

function hasOwnChoice(filter: CollectionFilter): boolean {
	return (
		Object.values(filter.own).some((values) => values.length > 0) ||
		Object.values(filter.ownTexts).some((text) => text.trim() !== '') ||
		filter.ticked.length > 0
	);
}

export function hasYears(filter: CollectionFilter): boolean {
	return filter.yearFrom !== null || filter.yearTo !== null;
}

function hasChoice(filter: CollectionFilter, field: FilterField): boolean {
	if (field === 'years') return hasYears(filter);
	if (field === 'favourites') return filter.favourites;
	if (field === 'authors') return filter.authors.length > 0 || filter.unknownAuthor;
	return filter[field].length > 0;
}

export function isEmptyFilter(filter: CollectionFilter): boolean {
	return FILTER_FIELDS.every((field) => !hasChoice(filter, field)) && !hasOwnChoice(filter);
}

const searchTerms = new Map<string, string>();

function searchTerm(text: string): string {
	let term = searchTerms.get(text);
	if (term === undefined) {
		if (searchTerms.size > 50) searchTerms.clear();
		term = normalizeForSearch(text);
		searchTerms.set(text, term);
	}
	return term;
}

function ownMatches(artwork: WallArtwork, filter: CollectionFilter, skip?: FilterSkip): boolean {
	const listsMatch = Object.entries(filter.own).every(([id, chosen]) => {
		if (chosen.length === 0 || skip === `own:${id}`) return true;
		const entry = artwork.own?.[id];
		return Array.isArray(entry) && entry.some((value) => chosen.includes(value));
	});
	const textsMatch = Object.entries(filter.ownTexts).every(([id, text]) => {
		const term = searchTerm(text);
		if (!term || skip === `ownText:${id}`) return true;
		const entry = artwork.own?.[id];
		return typeof entry === 'string' && normalizeForSearch(entry).includes(term);
	});
	const ticksMatch = skip === 'ticked' || filter.ticked.every((id) => artwork.own?.[id] === true);
	return listsMatch && textsMatch && ticksMatch;
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

export function filterValuesOf(artwork: WallArtwork, field: FilterValueField): string[] {
	if (field === 'eras') return artwork.eraCode ? [artwork.eraCode] : [];
	if (field === 'types') return artwork.typeCode ? [artwork.typeCode] : [];
	if (field === 'authors') return artwork.authors.length > 0 ? artwork.authors : [UNKNOWN_AUTHOR];
	if (field === 'periods') return artwork.period ? [artwork.period] : [];
	if (field === 'styles') return artwork.styles;
	if (field === 'materials') return artwork.materials;
	if (field === 'locations') return artwork.location ? [artwork.location] : [];
	return missingOf(artwork);
}

export function chosenValues(filter: CollectionFilter, field: FilterValueField): string[] {
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
	return filterValuesOf(artwork, field).some((value) => chosen.includes(value));
}

export function matchesFilter(
	artwork: WallArtwork,
	filter: CollectionFilter,
	skip?: FilterSkip
): boolean {
	return (
		FILTER_FIELDS.every(
			(field) => field === skip || !hasChoice(filter, field) || fieldMatches(artwork, filter, field)
		) && ownMatches(artwork, filter, skip)
	);
}

export function applyFilter(artworks: WallArtwork[], filter: CollectionFilter): WallArtwork[] {
	return isEmptyFilter(filter)
		? artworks
		: artworks.filter((artwork) => matchesFilter(artwork, filter));
}

const NAME_COLLATOR = new Intl.Collator('pl');

function fixedOrder(field: FilterValueField): readonly string[] | undefined {
	if (field === 'eras') return ERA_CODES;
	if (field === 'types') return ARTWORK_TYPE_CODES;
	if (field === 'missing') return MISSING_DATA;
	return undefined;
}

export function filterOptions(
	artworks: WallArtwork[],
	filter: CollectionFilter,
	field: FilterValueField
): FilterOption[] {
	const counts = new Map<string, number>();
	for (const artwork of artworks) {
		if (!matchesFilter(artwork, filter, field)) continue;
		for (const value of filterValuesOf(artwork, field))
			counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	for (const value of chosenValues(filter, field)) counts.set(value, counts.get(value) ?? 0);

	const options = [...counts].map(([value, count]) => ({ value, count }));
	const order = fixedOrder(field);
	if (order) return options.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
	const keys = field === 'authors' ? authorSortKeys(artworks) : new Map<string, string>();
	return options.sort((a, b) => {
		if (a.value === UNKNOWN_AUTHOR) return 1;
		if (b.value === UNKNOWN_AUTHOR) return -1;
		return (
			b.count - a.count || NAME_COLLATOR.compare(sortKeyOf(a.value, keys), sortKeyOf(b.value, keys))
		);
	});
}

function byCountAndName(a: FilterOption, b: FilterOption): number {
	return b.count - a.count || NAME_COLLATOR.compare(a.value, b.value);
}

export function ownFilterOptions(
	artworks: WallArtwork[],
	filter: CollectionFilter,
	fieldId: string
): FilterOption[] {
	const counts = new Map<string, number>();
	for (const artwork of artworks) {
		const entry = artwork.own?.[fieldId];
		if (!Array.isArray(entry) || !matchesFilter(artwork, filter, `own:${fieldId}`)) continue;
		for (const value of entry) counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	for (const value of filter.own[fieldId] ?? []) counts.set(value, counts.get(value) ?? 0);
	return [...counts].map(([value, count]) => ({ value, count })).sort(byCountAndName);
}

export function tickedOptions(
	artworks: WallArtwork[],
	filter: CollectionFilter,
	fields: readonly OwnFieldDefinition[]
): FilterOption[] {
	return fields.flatMap((field) => {
		if (field.kind !== 'flag') return [];
		const others = { ...filter, ticked: filter.ticked.filter((id) => id !== field.id) };
		const count = artworks.filter(
			(artwork) => artwork.own?.[field.id] === true && matchesFilter(artwork, others)
		).length;
		return count > 0 || filter.ticked.includes(field.id) ? [{ value: field.id, count }] : [];
	});
}

export function hasOwnText(artworks: WallArtwork[], fieldId: string): boolean {
	return artworks.some((artwork) => typeof artwork.own?.[fieldId] === 'string');
}

export function toggleOwnValue(
	filter: CollectionFilter,
	fieldId: string,
	value: string
): CollectionFilter {
	const current = filter.own[fieldId] ?? [];
	const next = current.includes(value)
		? current.filter((item) => item !== value)
		: [...current, value];
	return { ...filter, own: { ...filter.own, [fieldId]: next } };
}

export function setOwnText(
	filter: CollectionFilter,
	fieldId: string,
	text: string
): CollectionFilter {
	return { ...filter, ownTexts: { ...filter.ownTexts, [fieldId]: text } };
}

export function toggleTicked(filter: CollectionFilter, fieldId: string): CollectionFilter {
	const ticked = filter.ticked.includes(fieldId)
		? filter.ticked.filter((id) => id !== fieldId)
		: [...filter.ticked, fieldId];
	return { ...filter, ticked };
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
		FILTER_FIELDS.every((field) => field === 'favourites' || !hasChoice(filter, field)) &&
		!hasOwnChoice(filter)
	);
}

export function toggleValue(
	filter: CollectionFilter,
	field: FilterValueField,
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
