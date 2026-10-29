import { describe, expect, it } from 'vitest';
import { sourceColumns, sourceFromRow } from './wikipedia-source.ts';

const source = {
	title: 'Barok',
	url: 'https://pl.wikipedia.org/wiki/Barok',
	licence: 'CC BY-SA 4.0',
	fetchedOn: '2026-10-24'
};

const columns = {
	source_title: source.title,
	source_url: source.url,
	source_licence: source.licence,
	source_fetched_on: source.fetchedOn
};

describe('Wikipedia source columns', () => {
	it('maps the columns to a source and back', () => {
		expect(sourceFromRow(columns)).toEqual(source);
		expect(sourceColumns(source)).toEqual(columns);
	});

	it('gives no source unless every column is filled', () => {
		expect(sourceFromRow({ ...columns, source_licence: null })).toBeNull();
	});

	it('writes empty columns for no source', () => {
		expect(sourceColumns(null)).toEqual({
			source_title: null,
			source_url: null,
			source_licence: null,
			source_fetched_on: null
		});
	});
});
