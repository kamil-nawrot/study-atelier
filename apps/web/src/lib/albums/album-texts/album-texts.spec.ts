import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readAlbumSource } from '#lib/albums/album-format/album-format.ts';
import type { AlbumSource } from '#lib/albums/types/album-source.ts';
import { readAlbumTexts } from './album-texts.ts';

type Json = Record<string, Record<string, Record<string, unknown>>> & { title: string };

function read(file: string): unknown {
	return JSON.parse(readFileSync(`static/albums/sample-album/${file}`, 'utf8'));
}

const source = (readAlbumSource(read('album.json'), 'sample-album') as { source: AlbumSource })
	.source;

function texts(): Json {
	return read('pl.json') as Json;
}

function errorsOf(json: unknown): string[] {
	return readAlbumTexts(json, source, 'sample-album', 'pl').errors ?? [];
}

describe('readAlbumTexts', () => {
	it('joins the texts of one language with the entries of the album', () => {
		const read = readAlbumTexts(texts(), source, 'sample-album', 'pl');

		if (read.errors) throw new Error(read.errors.join('\n'));
		const { album } = read;
		expect(album).toMatchObject({
			slug: 'sample-album',
			language: 'pl',
			eraCode: 'contemporary',
			title: 'Sample album'
		});
		expect(album.artworks[0]).toMatchObject({
			id: 'spiral-study',
			revision: 1,
			title: 'Spiral Study',
			alternativeTitles: ['Study of a Spiral'],
			description: 'A made-up painting of a dark spiral.'
		});
		expect(album.artworks[1]).toMatchObject({ alternativeTitles: [], description: null });
		expect(album.values.find((value) => value.id === 'sample-oil')).toMatchObject({
			category: 'material',
			name: 'oil paint',
			alternativeNames: ['oil']
		});
		expect(album.terms.map((term) => [term.kind, term.name])).toEqual([
			['term', 'spiral'],
			['figure', 'Sample Patron']
		]);
		expect(album.events[0]).toMatchObject({ name: 'Sample show', yearTo: 2026, source: null });
	});

	it('refuses texts of an unknown entry and an entry without texts', () => {
		const json = texts();
		json.artworks['green-line'] = { title: 'Green Line' };
		delete json.artworks['blue-square'];

		expect(errorsOf(json)).toEqual([
			'artworks: has texts of an unknown entry "green-line"',
			'artworks: has no texts of "blue-square"'
		]);
	});

	it('refuses a country on a value that is no author, a long summary and a source without a link', () => {
		const json = texts();
		json.values['sample-style'] = { name: 'Sample style', country: 'Sampleland' };
		json.values['sample-gallery'] = { name: 'Sample Gallery', summary: 'x'.repeat(301) };
		json.terms['sample-spiral'] = {
			name: 'spiral',
			source: { title: 'Wikipedia', licence: 'CC BY-SA' }
		};

		expect(errorsOf(json)).toEqual([
			'values.sample-style: has "country" but is no author',
			'values.sample-gallery.summary: is longer than 300 characters',
			'terms.sample-spiral.source: has no "url"',
			'terms.sample-spiral.source.url: is not a text'
		]);
	});

	it('refuses texts of another format without a title', () => {
		const json = { ...texts(), format: 2 } as Record<string, unknown>;
		delete json.title;

		expect(errorsOf(json)).toEqual([
			'pl: has no "title"',
			'pl.format: is not 1',
			'pl.title: is not a text'
		]);
	});
});
