import { readAlbumSource } from '#lib/albums/album-format/album-format.ts';
import {
	ALBUM_INDEX_FILE,
	ALBUM_SOURCE_FILE,
	readAlbumIndex
} from '#lib/albums/album-files/album-files.ts';
import { readAlbumTexts } from '#lib/albums/album-texts/album-texts.ts';
import { imageFileSize } from '#lib/albums/utils/image-file-size/image-file-size.ts';
import type { AlbumListing } from '#lib/albums/types/album-listing.ts';
import type { AlbumSource } from '#lib/albums/types/album-source.ts';

export type AlbumFiles = {
	folders: () => string[];
	files: (folder: string) => string[];
	read: (path: string) => Uint8Array | undefined;
};

const LANGUAGE_FILE = /^([a-z]{2})\.json$/;

function readJson(files: AlbumFiles, path: string, errors: string[]): unknown {
	const bytes = files.read(path);
	if (!bytes) {
		errors.push(`${path}: is missing`);
		return undefined;
	}
	try {
		return JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		errors.push(`${path}: is not valid JSON`);
		return undefined;
	}
}

function checkImages(files: AlbumFiles, slug: string, source: AlbumSource): string[] {
	const errors: string[] = [];
	const used = new Set<string>();
	for (const artwork of source.artworks) {
		for (const image of artwork.images) {
			used.add(image.path);
			const bytes = files.read(image.path);
			if (!bytes) {
				errors.push(`${image.path}: is missing, although ${artwork.id} shows it`);
				continue;
			}
			const size = imageFileSize(bytes);
			if (size?.width !== image.width || size.height !== image.height)
				errors.push(
					`${image.path}: is ${size ? `${size.width}×${size.height}` : 'not a readable image'}, not ${image.width}×${image.height} as ${artwork.id} says`
				);
		}
	}
	for (const file of files.files(slug))
		if (file.startsWith('images/') && !used.has(`${slug}/${file}`))
			errors.push(`${slug}/${file}: is shown by no artwork`);
	return errors;
}

function checkAlbum(files: AlbumFiles, listing: AlbumListing): string[] {
	const { slug } = listing;
	const errors: string[] = [];
	const own = files.files(slug);
	for (const file of own)
		if (file !== ALBUM_SOURCE_FILE && !LANGUAGE_FILE.test(file) && !file.startsWith('images/'))
			errors.push(`${slug}/${file}: is not a file of an album`);
	const languages = own.flatMap((file) => LANGUAGE_FILE.exec(file)?.[1] ?? []).sort();
	if (languages.join() !== [...listing.languages].sort().join())
		errors.push(
			`${ALBUM_INDEX_FILE}: lists ${slug} in ${listing.languages.join(', ')}, but its text files are ${languages.join(', ') || 'none'}`
		);
	const read = readAlbumSource(readJson(files, `${slug}/${ALBUM_SOURCE_FILE}`, errors), slug);
	if (read.errors)
		return [...errors, ...read.errors.map((error) => `${slug}/${ALBUM_SOURCE_FILE}: ${error}`)];
	for (const language of languages) {
		const path = `${slug}/${language}.json`;
		const texts = readAlbumTexts(readJson(files, path, errors), read.source, slug, language);
		if (texts.errors) errors.push(...texts.errors.map((error) => `${path}: ${error}`));
	}
	return [...errors, ...checkImages(files, slug, read.source)];
}

export function checkAlbums(files: AlbumFiles): string[] {
	const errors: string[] = [];
	const index = readAlbumIndex(readJson(files, ALBUM_INDEX_FILE, errors));
	if (index.errors)
		return [...errors, ...index.errors.map((error) => `${ALBUM_INDEX_FILE}: ${error}`)];
	const listed = new Set(index.albums.map((album) => album.slug));
	const folders = new Set(files.folders());
	for (const folder of folders)
		if (!listed.has(folder)) errors.push(`${folder}: is a folder missing from ${ALBUM_INDEX_FILE}`);
	for (const album of index.albums) {
		if (!folders.has(album.slug))
			errors.push(`${ALBUM_INDEX_FILE}: lists ${album.slug}, which has no folder`);
		else errors.push(...checkAlbum(files, album));
	}
	return errors;
}
