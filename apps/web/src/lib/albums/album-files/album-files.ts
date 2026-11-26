import { readAlbumSource } from '#lib/albums/album-format/album-format.ts';
import { AlbumReader, ENTRY_ID } from '#lib/albums/album-reader/album-reader.ts';
import { readAlbumTexts } from '#lib/albums/album-texts/album-texts.ts';
import { albumFileUrl } from '#lib/images/album/album.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumListing } from '#lib/albums/types/album-listing.ts';

export const ALBUM_INDEX_FILE = 'index.json';
export const ALBUM_SOURCE_FILE = 'album.json';
export const LANGUAGE = /^[a-z]{2}$/;

type Fetch = typeof fetch;

export function readAlbumIndex(
	json: unknown
): { albums: AlbumListing[]; errors?: undefined } | { errors: string[] } {
	const reader = new AlbumReader();
	const fields = reader.fields(json, 'index', ['format', 'albums']);
	if (!fields) return { errors: reader.errors };
	if (fields.format !== 1) reader.fail('index.format', 'is not 1');
	const albums = reader.list(fields.albums, 'albums', (value, path) => {
		const album = reader.fields(value, path, ['slug', 'languages'], ['sample']);
		if (!album) return undefined;
		const slug = reader.text(album.slug, `${path}.slug`, { max: 60, pattern: ENTRY_ID });
		const languages = reader.texts(album.languages, `${path}.languages`, { pattern: LANGUAGE });
		if (languages.length === 0) reader.fail(`${path}.languages`, 'is empty');
		const sample = reader.flag(album.sample, `${path}.sample`);
		return slug ? { slug, languages, sample } : undefined;
	});
	const slugs = albums.map((album) => ({ id: album.slug }));
	reader.uniqueIds(slugs, 'albums');
	return reader.errors.length > 0 ? { errors: reader.errors } : { albums };
}

async function fetchJson(fetcher: Fetch, path: string): Promise<unknown> {
	try {
		const response = await fetcher(albumFileUrl(path));
		return response.ok ? await response.json() : undefined;
	} catch {
		return undefined;
	}
}

export async function loadAlbumListings(
	language: string,
	withSamples: boolean,
	fetcher: Fetch = fetch
): Promise<AlbumListing[] | undefined> {
	const read = readAlbumIndex(await fetchJson(fetcher, ALBUM_INDEX_FILE));
	if (read.errors) return undefined;
	return read.albums.filter(
		(album) => album.languages.includes(language) && (withSamples || !album.sample)
	);
}

export async function loadAlbum(
	slug: string,
	language: string,
	fetcher: Fetch = fetch
): Promise<Album | undefined> {
	const [sourceJson, textsJson] = await Promise.all([
		fetchJson(fetcher, `${slug}/${ALBUM_SOURCE_FILE}`),
		fetchJson(fetcher, `${slug}/${language}.json`)
	]);
	const source = readAlbumSource(sourceJson, slug);
	if (source.errors) return undefined;
	const texts = readAlbumTexts(textsJson, source.source, slug, language);
	return texts.errors ? undefined : texts.album;
}
