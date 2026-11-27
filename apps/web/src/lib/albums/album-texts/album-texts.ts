import { ALBUM_FORMAT } from '#lib/albums/album-format/album-format.ts';
import { AlbumReader, HTTPS_URL } from '#lib/albums/album-reader/album-reader.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumSource } from '#lib/albums/types/album-source.ts';
import type { AlbumTextSource } from '#lib/albums/types/album-text-source.ts';

const NAME = { max: 120 };
const SUMMARY = { max: 300 };
const DEFINITION = { max: 4000 };
const NOTE = { max: 20000 };

type Fields = Record<string, unknown>;

function readTextSource(reader: AlbumReader, value: unknown, path: string): AlbumTextSource | null {
	if (value === undefined) return null;
	const fields = reader.fields(value, path, ['title', 'url', 'licence']);
	if (!fields) return null;
	const title = reader.text(fields.title, `${path}.title`, NAME);
	const url = reader.text(fields.url, `${path}.url`, { pattern: HTTPS_URL });
	const licence = reader.text(fields.licence, `${path}.licence`, { max: 60 });
	return title && url && licence ? { title, url, licence } : null;
}

function textsOf<T extends { id: string }, R>(
	reader: AlbumReader,
	value: unknown,
	path: string,
	entries: readonly T[],
	read: (entry: T, fields: Fields, path: string) => R
): R[] {
	const keys = typeof value === 'object' && value !== null ? Object.keys(value) : [];
	const all = value === undefined ? {} : reader.fields(value, path, [], keys);
	if (!all) return [];
	const ids = new Set(entries.map((entry) => entry.id));
	for (const key of Object.keys(all))
		if (!ids.has(key)) reader.fail(path, `has texts of an unknown entry "${key}"`);
	return entries.flatMap((entry) => {
		const entryPath = `${path}.${entry.id}`;
		if (!(entry.id in all)) return reader.fail(path, `has no texts of "${entry.id}"`) ?? [];
		return [read(entry, all[entry.id] as Fields, entryPath)];
	});
}

function readArtworks(reader: AlbumReader, value: unknown, source: AlbumSource): Album['artworks'] {
	return textsOf(reader, value, 'artworks', source.artworks, (artwork, json, path) => {
		const fields = reader.fields(json, path, ['title'], ['alternativeTitles', 'description']) ?? {};
		return {
			...artwork,
			title: reader.text(fields.title, `${path}.title`, { max: 300 }) ?? '',
			alternativeTitles: reader.texts(fields.alternativeTitles, `${path}.alternativeTitles`, {
				max: 300
			}),
			description: reader.optionalText(fields.description, `${path}.description`, NOTE)
		};
	});
}

function readValues(reader: AlbumReader, value: unknown, source: AlbumSource): Album['values'] {
	return textsOf(reader, value, 'values', source.values, (entry, json, path) => {
		const fields =
			reader.fields(
				json,
				path,
				['name'],
				['alternativeNames', 'summary', 'description', 'country']
			) ?? {};
		if ('country' in fields && entry.category !== 'author')
			reader.fail(path, 'has "country" but is no author');
		return {
			...entry,
			name: reader.text(fields.name, `${path}.name`, NAME) ?? '',
			alternativeNames: reader.texts(fields.alternativeNames, `${path}.alternativeNames`, NAME),
			summary: reader.optionalText(fields.summary, `${path}.summary`, SUMMARY),
			description: reader.optionalText(fields.description, `${path}.description`, NOTE),
			country: reader.optionalText(fields.country, `${path}.country`, { max: 60 })
		};
	});
}

function readTerms(reader: AlbumReader, value: unknown, source: AlbumSource): Album['terms'] {
	return textsOf(reader, value, 'terms', source.terms, (entry, json, path) => {
		const fields =
			reader.fields(
				json,
				path,
				['name'],
				['alternativeNames', 'definition', 'country', 'source']
			) ?? {};
		if ('country' in fields && entry.kind !== 'figure')
			reader.fail(path, 'has "country" but is no figure');
		return {
			...entry,
			name: reader.text(fields.name, `${path}.name`, NAME) ?? '',
			alternativeNames: reader.texts(fields.alternativeNames, `${path}.alternativeNames`, NAME),
			definition: reader.optionalText(fields.definition, `${path}.definition`, DEFINITION),
			country: reader.optionalText(fields.country, `${path}.country`, { max: 60 }),
			source: readTextSource(reader, fields.source, `${path}.source`)
		};
	});
}

function readEvents(reader: AlbumReader, value: unknown, source: AlbumSource): Album['events'] {
	return textsOf(reader, value, 'events', source.events, (entry, json, path) => {
		const fields = reader.fields(json, path, ['name'], ['description', 'source']) ?? {};
		return {
			...entry,
			name: reader.text(fields.name, `${path}.name`, NAME) ?? '',
			description: reader.optionalText(fields.description, `${path}.description`, SUMMARY),
			source: readTextSource(reader, fields.source, `${path}.source`)
		};
	});
}

export function readAlbumTexts(
	json: unknown,
	source: AlbumSource,
	slug: string,
	language: string
): { album: Album; errors?: undefined } | { errors: string[] } {
	const reader = new AlbumReader();
	const fields = reader.fields(
		json,
		language,
		['format', 'title', 'description', 'artworks'],
		['values', 'terms', 'events']
	);
	if (!fields) return { errors: reader.errors };
	if (fields.format !== ALBUM_FORMAT) reader.fail(`${language}.format`, `is not ${ALBUM_FORMAT}`);
	const album: Album = {
		slug,
		language,
		eraCode: source.eraCode,
		title: reader.text(fields.title, `${language}.title`, NAME) ?? '',
		description: reader.text(fields.description, `${language}.description`, { max: 600 }) ?? '',
		artworks: readArtworks(reader, fields.artworks, source),
		values: readValues(reader, fields.values, source),
		terms: readTerms(reader, fields.terms, source),
		events: readEvents(reader, fields.events, source)
	};
	return reader.errors.length > 0 ? { errors: reader.errors } : { album };
}
