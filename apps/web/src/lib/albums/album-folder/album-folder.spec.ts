import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkAlbums, type AlbumFiles } from './album-folder.ts';

const ROOT = 'static/albums';

function filesIn(folder: string, prefix = ''): string[] {
	return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory()
			? filesIn(path.join(folder, entry.name), `${prefix}${entry.name}/`)
			: [`${prefix}${entry.name}`]
	);
}

function folderFiles(root: string): AlbumFiles {
	return {
		folders: () =>
			readdirSync(root, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => entry.name),
		files: (folder) => filesIn(path.join(root, folder)),
		read: (file) => {
			const full = path.join(root, file);
			return existsSync(full) ? new Uint8Array(readFileSync(full)) : undefined;
		}
	};
}

function memoryFiles(changes: Record<string, string | Uint8Array | null>): AlbumFiles {
	const real = folderFiles(ROOT);
	const files = new Map<string, Uint8Array>();
	for (const folder of real.folders())
		for (const file of real.files(folder))
			files.set(`${folder}/${file}`, real.read(`${folder}/${file}`)!);
	files.set('index.json', real.read('index.json')!);
	for (const [file, content] of Object.entries(changes)) {
		if (content === null) files.delete(file);
		else files.set(file, typeof content === 'string' ? new TextEncoder().encode(content) : content);
	}
	const names = [...files.keys()];
	return {
		folders: () => [
			...new Set(names.filter((name) => name.includes('/')).map((name) => name.split('/')[0]))
		],
		files: (folder) =>
			names
				.filter((name) => name.startsWith(`${folder}/`))
				.map((name) => name.slice(folder.length + 1)),
		read: (file) => files.get(file)
	};
}

function json(file: string): Record<string, unknown> {
	return JSON.parse(readFileSync(path.join(ROOT, file), 'utf8')) as Record<string, unknown>;
}

describe('every album in the static files', () => {
	it('passes the check of its index, files, texts and images', () => {
		expect(checkAlbums(folderFiles(ROOT))).toEqual([]);
	});
});

describe('checkAlbums', () => {
	it('refuses a folder missing from the index and an album of the index without a folder', () => {
		const index = {
			format: 1,
			albums: [
				{ slug: 'sample-album', languages: ['pl'] },
				{ slug: 'gone', languages: ['pl'] }
			]
		};

		expect(
			checkAlbums(memoryFiles({ 'index.json': JSON.stringify(index), 'extra/album.json': '{}' }))
		).toEqual([
			'extra: is a folder missing from index.json',
			'index.json: lists gone, which has no folder'
		]);
	});

	it('refuses an index whose languages differ from the text files and a stray file', () => {
		expect(
			checkAlbums(memoryFiles({ 'sample-album/en.json': '{', 'sample-album/notes.txt': 'draft' }))
		).toEqual([
			'sample-album/notes.txt: is not a file of an album',
			'index.json: lists sample-album in pl, but its text files are en, pl',
			'sample-album/en.json: is not valid JSON',
			'sample-album/en.json: en: is not an object'
		]);
	});

	it('refuses a missing image, an image of another size and an image no artwork shows', () => {
		const square = readFileSync(path.join(ROOT, 'sample-album/images/blue-square.webp'));

		expect(
			checkAlbums(
				memoryFiles({
					'sample-album/images/red-circle.webp': new Uint8Array(square),
					'sample-album/images/blue-square.webp': null,
					'sample-album/images/unused.webp': new Uint8Array(square)
				})
			)
		).toEqual([
			'sample-album/images/blue-square.webp: is missing, although blue-square shows it',
			'sample-album/images/red-circle.webp: is 800×600, not 600×600 as red-circle says',
			'sample-album/images/unused.webp: is shown by no artwork'
		]);
	});

	it('names the file of every error in the album and its texts', () => {
		const album = json('sample-album/album.json');
		const texts = json('sample-album/pl.json');

		expect(
			checkAlbums(
				memoryFiles({ 'sample-album/album.json': JSON.stringify({ ...album, era: 'future' }) })
			)
		).toEqual([
			'sample-album/album.json: album.era: is not one of prehistory, antiquity, middle_ages, early_modern, modern, contemporary'
		]);
		expect(
			checkAlbums(memoryFiles({ 'sample-album/pl.json': JSON.stringify({ ...texts, title: '' }) }))
		).toEqual(['sample-album/pl.json: pl.title: is empty or has spaces around it']);
	});
});
