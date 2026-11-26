import { ARTWORK_TYPE_CODES } from '#lib/catalogue/artwork-types/artwork-types.ts';
import { COUNTRY_CODES } from '#lib/catalogue/countries/countries.ts';
import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import { PLACE_TYPES } from '#lib/catalogue/place-types/place-types.ts';
import { FIGURE_CATEGORIES, TERM_CATEGORIES } from '#lib/glossary/categories/categories.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { AlbumImage } from '#lib/albums/types/album-image.ts';
import type { AlbumSource } from '#lib/albums/types/album-source.ts';
import {
	AlbumReader,
	ENTRY_ID,
	HTTPS_URL,
	WIKIDATA_ID
} from '#lib/albums/album-reader/album-reader.ts';

export const ALBUM_FORMAT = 1;
export const ALBUM_IMAGE_FILE = /^images\/[a-z0-9]+(-[a-z0-9]+)*\.(webp|jpg|png)$/;
export const MAX_ARTWORK_IMAGES = 5;

const CATEGORIES: readonly CategoryCode[] = ['author', 'period', 'style', 'material', 'location'];
const KINDS = ['term', 'figure'] as const;

type Artwork = AlbumSource['artworks'][number];
type Value = AlbumSource['values'][number];
type Term = AlbumSource['terms'][number];
type Event = AlbumSource['events'][number];

function readId(reader: AlbumReader, value: unknown, path: string): string | undefined {
	return reader.text(value, path, { max: 60, pattern: ENTRY_ID });
}

function readIds(reader: AlbumReader, value: unknown, path: string): string[] {
	if (value === undefined) return [];
	return reader.list(value, path, (item, itemPath) => readId(reader, item, itemPath));
}

function readImage(
	reader: AlbumReader,
	slug: string,
	value: unknown,
	path: string
): AlbumImage | undefined {
	const fields = reader.fields(
		value,
		path,
		['file', 'width', 'height', 'licence'],
		['licenceUrl', 'attribution', 'source']
	);
	if (!fields) return undefined;
	const file = reader.text(fields.file, `${path}.file`, { pattern: ALBUM_IMAGE_FILE });
	const width = reader.integer(fields.width, `${path}.width`, 1);
	const height = reader.integer(fields.height, `${path}.height`, 1);
	const licence = reader.text(fields.licence, `${path}.licence`, { max: 60 });
	const licenceUrl = reader.optionalText(fields.licenceUrl, `${path}.licenceUrl`, {
		pattern: HTTPS_URL
	});
	const attribution = reader.optionalText(fields.attribution, `${path}.attribution`, { max: 200 });
	reader.optionalText(fields.source, `${path}.source`, { pattern: HTTPS_URL });
	if (!file || !width || !height || !licence) return undefined;
	return { path: `${slug}/${file}`, width, height, licence, licenceUrl, attribution };
}

function readArtwork(
	reader: AlbumReader,
	slug: string,
	value: unknown,
	path: string
): Artwork | undefined {
	const fields = reader.fields(
		value,
		path,
		['id', 'revision', 'images'],
		[
			'wikidata',
			'type',
			'era',
			'yearFrom',
			'yearTo',
			'yearApproximate',
			'values',
			'terms',
			'events'
		]
	);
	if (!fields) return undefined;
	const id = readId(reader, fields.id, `${path}.id`);
	const revision = reader.integer(fields.revision, `${path}.revision`, 1);
	const yearFrom = reader.year(fields.yearFrom, `${path}.yearFrom`);
	const yearTo = reader.year(fields.yearTo, `${path}.yearTo`);
	reader.yearSpan(yearFrom, yearTo, path);
	const images = reader.list(
		fields.images,
		`${path}.images`,
		(item, itemPath) => readImage(reader, slug, item, itemPath),
		MAX_ARTWORK_IMAGES
	);
	if (images.length === 0) reader.fail(`${path}.images`, 'is empty');
	const artwork = {
		wikidataId: reader.optionalText(fields.wikidata, `${path}.wikidata`, { pattern: WIKIDATA_ID }),
		typeCode: reader.optionalChoice(fields.type, `${path}.type`, ARTWORK_TYPE_CODES),
		eraCode: reader.optionalChoice(fields.era, `${path}.era`, ERA_CODES),
		yearFrom,
		yearTo,
		yearApproximate: reader.flag(fields.yearApproximate, `${path}.yearApproximate`),
		valueIds: readIds(reader, fields.values, `${path}.values`),
		termIds: readIds(reader, fields.terms, `${path}.terms`),
		eventIds: readIds(reader, fields.events, `${path}.events`),
		images
	};
	return id && revision ? { id, revision, ...artwork } : undefined;
}

function readValue(reader: AlbumReader, value: unknown, path: string): Value | undefined {
	const fields = reader.fields(
		value,
		path,
		['id', 'revision', 'category'],
		['wikidata', 'birthYear', 'deathYear', 'yearsApproximate', 'countryCode', 'placeType']
	);
	if (!fields) return undefined;
	const id = readId(reader, fields.id, `${path}.id`);
	const revision = reader.integer(fields.revision, `${path}.revision`, 1);
	const category = reader.choice(fields.category, `${path}.category`, CATEGORIES);
	const own = {
		author: ['birthYear', 'deathYear', 'yearsApproximate'],
		location: ['countryCode', 'placeType']
	};
	for (const [owner, keys] of Object.entries(own))
		for (const key of keys)
			if (key in fields && category !== owner) reader.fail(path, `has "${key}" but is no ${owner}`);
	const birthYear = reader.year(fields.birthYear, `${path}.birthYear`);
	const deathYear = reader.year(fields.deathYear, `${path}.deathYear`);
	reader.yearSpan(birthYear, deathYear, path);
	const details = {
		wikidataId: reader.optionalText(fields.wikidata, `${path}.wikidata`, { pattern: WIKIDATA_ID }),
		birthYear,
		deathYear,
		yearsApproximate: reader.flag(fields.yearsApproximate, `${path}.yearsApproximate`),
		countryCode: reader.optionalChoice(fields.countryCode, `${path}.countryCode`, COUNTRY_CODES),
		placeType: reader.optionalChoice(fields.placeType, `${path}.placeType`, PLACE_TYPES)
	};
	return id && revision && category ? { id, revision, category, ...details } : undefined;
}

function readTerm(reader: AlbumReader, value: unknown, path: string): Term | undefined {
	const fields = reader.fields(
		value,
		path,
		['id', 'revision', 'kind'],
		['category', 'wikidata', 'birthYear', 'deathYear', 'yearsApproximate']
	);
	if (!fields) return undefined;
	const id = readId(reader, fields.id, `${path}.id`);
	const revision = reader.integer(fields.revision, `${path}.revision`, 1);
	const kind = reader.choice(fields.kind, `${path}.kind`, KINDS);
	const categories = kind === 'figure' ? FIGURE_CATEGORIES : TERM_CATEGORIES;
	if (kind === 'term')
		for (const key of ['birthYear', 'deathYear', 'yearsApproximate'])
			if (key in fields) reader.fail(path, `has "${key}" but is no figure`);
	const birthYear = reader.year(fields.birthYear, `${path}.birthYear`);
	const deathYear = reader.year(fields.deathYear, `${path}.deathYear`);
	reader.yearSpan(birthYear, deathYear, path);
	const details = {
		category: reader.optionalChoice(fields.category, `${path}.category`, categories),
		wikidataId: reader.optionalText(fields.wikidata, `${path}.wikidata`, { pattern: WIKIDATA_ID }),
		birthYear,
		deathYear,
		yearsApproximate: reader.flag(fields.yearsApproximate, `${path}.yearsApproximate`)
	};
	return id && revision && kind ? { id, revision, kind, ...details } : undefined;
}

function readEvent(reader: AlbumReader, value: unknown, path: string): Event | undefined {
	const fields = reader.fields(
		value,
		path,
		['id', 'revision', 'yearTo'],
		['yearFrom', 'yearApproximate']
	);
	if (!fields) return undefined;
	const id = readId(reader, fields.id, `${path}.id`);
	const revision = reader.integer(fields.revision, `${path}.revision`, 1);
	const yearFrom = reader.year(fields.yearFrom, `${path}.yearFrom`);
	const yearTo = reader.year(fields.yearTo, `${path}.yearTo`);
	if (yearFrom !== null && yearTo !== null && yearFrom >= yearTo)
		reader.fail(path, 'does not end after it starts');
	const yearApproximate = reader.flag(fields.yearApproximate, `${path}.yearApproximate`);
	return id && revision && yearTo !== null
		? { id, revision, yearFrom, yearTo, yearApproximate }
		: undefined;
}

function checkReferences(reader: AlbumReader, source: AlbumSource): void {
	const values = new Map(source.values.map((value) => [value.id, value]));
	const terms = new Set(source.terms.map((term) => term.id));
	const events = new Set(source.events.map((event) => event.id));
	for (const artwork of source.artworks) {
		const path = `artworks.${artwork.id}`;
		for (const id of artwork.valueIds)
			if (!values.has(id)) reader.fail(`${path}.values`, `names an unknown value "${id}"`);
		for (const id of artwork.termIds)
			if (!terms.has(id)) reader.fail(`${path}.terms`, `names an unknown term "${id}"`);
		for (const id of artwork.eventIds)
			if (!events.has(id)) reader.fail(`${path}.events`, `names an unknown event "${id}"`);
		const places = artwork.valueIds.filter((id) => values.get(id)?.category === 'location');
		if (places.length > 1) reader.fail(`${path}.values`, 'names more than one location');
		if (new Set(artwork.valueIds).size < artwork.valueIds.length)
			reader.fail(`${path}.values`, 'names a value twice');
	}
}

export function readAlbumSource(
	json: unknown,
	slug: string
): { source: AlbumSource; errors?: undefined } | { errors: string[] } {
	const reader = new AlbumReader();
	const fields = reader.fields(
		json,
		'album',
		['format', 'era', 'artworks'],
		['values', 'terms', 'events']
	);
	if (!fields) return { errors: reader.errors };
	if (fields.format !== ALBUM_FORMAT) reader.fail('album.format', `is not ${ALBUM_FORMAT}`);
	const eraCode = reader.choice(fields.era, 'album.era', ERA_CODES);
	const listed = <T>(key: string, item: (value: unknown, path: string) => T | undefined): T[] =>
		fields[key] === undefined ? [] : reader.list(fields[key], key, item);
	const source = {
		eraCode: eraCode ?? 'prehistory',
		artworks: listed('artworks', (value, path) => readArtwork(reader, slug, value, path)),
		values: listed('values', (value, path) => readValue(reader, value, path)),
		terms: listed('terms', (value, path) => readTerm(reader, value, path)),
		events: listed('events', (value, path) => readEvent(reader, value, path))
	};
	if (source.artworks.length === 0) reader.fail('artworks', 'is empty');
	for (const key of ['artworks', 'values', 'terms', 'events'] as const)
		reader.uniqueIds(source[key], key);
	checkReferences(reader, source);
	return reader.errors.length > 0 ? { errors: reader.errors } : { source };
}
