import { describe, expect, it } from 'vitest';
import { AlbumReader } from './album-reader.ts';

describe('AlbumReader', () => {
	it('names the path of every missing, unknown or wrong field', () => {
		const reader = new AlbumReader();
		const fields = reader.fields({ id: 'a', extra: 1 }, 'entry', ['id', 'revision'], ['note']);

		reader.integer('2', 'entry.revision', 1);
		reader.text(' padded', 'entry.id');

		expect(fields).toEqual({ id: 'a', extra: 1 });
		expect(reader.errors).toEqual([
			'entry: has no "revision"',
			'entry: has an unknown key "extra"',
			'entry.revision: is not a whole number',
			'entry.id: is empty or has spaces around it'
		]);
	});

	it('refuses the year 0, a year span that ends before it starts and a repeated id', () => {
		const reader = new AlbumReader();

		expect(reader.year(0, 'yearTo')).toBeNull();
		reader.yearSpan(1500, 1400, 'artwork');
		reader.uniqueIds([{ id: 'a' }, { id: 'a' }], 'artworks');

		expect(reader.errors).toEqual([
			'yearTo: is the year 0, which does not exist',
			'artwork: starts after it ends',
			'artworks: repeats the id "a"'
		]);
	});

	it('reads a missing optional field as empty without an error', () => {
		const reader = new AlbumReader();

		expect(reader.optionalText(undefined, 'note')).toBeNull();
		expect(reader.texts(undefined, 'names')).toEqual([]);
		expect(reader.flag(undefined, 'approximate')).toBe(false);
		expect(reader.optionalChoice(undefined, 'era', ['antiquity'])).toBeNull();
		expect(reader.errors).toEqual([]);
	});

	it('keeps the readable items of a list and caps its length', () => {
		const reader = new AlbumReader();

		const items = reader.list(['a', 2, 'c'], 'names', (value, path) => reader.text(value, path), 2);

		expect(items).toEqual(['a', 'c']);
		expect(reader.errors).toEqual(['names: has more than 2 items', 'names[1]: is not a text']);
	});
});
