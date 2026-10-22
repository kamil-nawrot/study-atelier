import { ARTWORK_TYPE_CODES } from './artwork-types.ts';
import { authorSortKeys, sortKeyOf } from './author-sort.ts';
import { ERA_CODES, eraName, isEraCode } from './eras.ts';
import { m } from '#lib/i18n/index.ts';
import { normalizeForSearch } from './search.ts';
import type {
	ArtworkTypeCode,
	CollectionFilter,
	EraCode,
	FilterField,
	FilterOption,
	FilterTag,
	MissingData,
	OwnFieldDefinition,
	TagParts,
	WallArtwork
} from './types.ts';

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

type ValueField = Exclude<FilterField, 'years' | 'favourites'>;

const NAME_FIELDS = ['authors', 'periods', 'styles', 'materials', 'locations'] as const;

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
	return FILTER_FIELDS.every((field) => !hasChoice(filter, field)) && !hasOwnChoice(filter);
}

function ownMatches(artwork: WallArtwork, filter: CollectionFilter, skip?: FilterSkip): boolean {
	const listsMatch = Object.entries(filter.own).every(([id, chosen]) => {
		if (chosen.length === 0 || skip === `own:${id}`) return true;
		const entry = artwork.own?.[id];
		return Array.isArray(entry) && entry.some((value) => chosen.includes(value));
	});
	const textsMatch = Object.entries(filter.ownTexts).every(([id, text]) => {
		const term = normalizeForSearch(text);
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

function ownTags(filter: CollectionFilter, fields: readonly OwnFieldDefinition[]): FilterTag[] {
	return fields.flatMap((field): FilterTag[] => {
		const name = field.name;
		if (field.kind === 'list') {
			return (filter.own[field.id] ?? []).map((value) => ({
				id: `own:${field.id}:${value}`,
				field: 'own',
				fieldId: field.id,
				value,
				parts: { field: name, value }
			}));
		}
		if (field.kind === 'text') {
			const text = (filter.ownTexts[field.id] ?? '').trim();
			return text
				? [
						{
							id: `ownText:${field.id}`,
							field: 'ownText',
							fieldId: field.id,
							value: text,
							parts: { field: name, value: text }
						}
					]
				: [];
		}
		return filter.ticked.includes(field.id)
			? [
					{
						id: `ticked:${field.id}`,
						field: 'ticked',
						fieldId: field.id,
						value: '',
						parts: { field: name, value: '' }
					}
				]
			: [];
	});
}

export function filterTags(
	filter: CollectionFilter,
	fields: readonly OwnFieldDefinition[] = []
): FilterTag[] {
	const tags: FilterTag[] = [];
	for (const field of FILTER_FIELDS) {
		if (field === 'missing') tags.push(...ownTags(filter, fields));
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
	if (tag.field === 'own') return toggleOwnValue(filter, tag.fieldId ?? '', tag.value);
	if (tag.field === 'ownText') return setOwnText(filter, tag.fieldId ?? '', '');
	if (tag.field === 'ticked') return toggleTicked(filter, tag.fieldId ?? '');
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
	if (tag.parts) return tag.parts;
	if (tag.field === 'own' || tag.field === 'ownText' || tag.field === 'ticked') {
		return { field: '', value: tag.value };
	}
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

export function pruneFilter(
	filter: CollectionFilter,
	artworks: WallArtwork[],
	fields: readonly OwnFieldDefinition[] = []
): CollectionFilter {
	const pruned = { ...filter };
	for (const field of NAME_FIELDS) {
		const existing = new Set(artworks.flatMap((artwork) => valuesOf(artwork, field)));
		pruned[field] = filter[field].filter((value) => existing.has(value));
	}
	const ofKind = (kind: OwnFieldDefinition['kind']): Set<string> =>
		new Set(fields.filter((field) => field.kind === kind).map((field) => field.id));
	const lists = ofKind('list');
	const texts = ofKind('text');
	const flags = ofKind('flag');
	pruned.own = Object.fromEntries(
		Object.entries(filter.own)
			.filter(([id]) => lists.has(id))
			.map(([id, values]) => {
				const existing = new Set(
					artworks.flatMap((artwork) => {
						const entry = artwork.own?.[id];
						return Array.isArray(entry) ? entry : [];
					})
				);
				return [id, values.filter((value) => existing.has(value))];
			})
			.filter(([, values]) => values.length > 0)
	);
	pruned.ownTexts = Object.fromEntries(
		Object.entries(filter.ownTexts).filter(([id]) => texts.has(id))
	);
	pruned.ticked = filter.ticked.filter((id) => flags.has(id));
	return pruned;
}
