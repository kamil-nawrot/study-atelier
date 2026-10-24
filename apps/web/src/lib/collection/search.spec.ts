import { describe, expect, it } from 'vitest';
import { filterByTitleOrAuthor } from './search.ts';

describe('filterByTitleOrAuthor', () => {
	const ermine = { title: 'Lady with an Ermine', authors: ['Anna Painter'] };
	const harbour = { title: 'Łódź Harbour', authors: ['Józef Sketcher', 'Clara Etcher'] };
	const night = { title: 'Starry Night', authors: [] };
	const items = [ermine, harbour, night];

	it('returns every item for an empty query', () => {
		expect(filterByTitleOrAuthor(items, '  ')).toEqual(items);
	});

	it('matches a fragment of the title without diacritics', () => {
		expect(filterByTitleOrAuthor(items, 'lodz')).toEqual([harbour]);
	});

	it('matches a fragment in another case', () => {
		expect(filterByTitleOrAuthor(items, 'ERMINE')).toEqual([ermine]);
	});

	it('matches a fragment of any author without diacritics', () => {
		expect(filterByTitleOrAuthor(items, 'jozef')).toEqual([harbour]);
		expect(filterByTitleOrAuthor(items, 'etcher')).toEqual([harbour]);
	});

	it('returns nothing when no title or author matches', () => {
		expect(filterByTitleOrAuthor(items, 'sunflowers')).toEqual([]);
	});
});
