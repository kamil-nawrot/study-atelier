import { describe, expect, it } from 'vitest';
import { filterByTitle, normalizeForSearch } from './search.ts';

describe('normalizeForSearch', () => {
	it('ignores case, diacritics and surrounding spaces', () => {
		expect(normalizeForSearch('  Żółć ŁĄKA ')).toBe('zolc laka');
	});
});

describe('filterByTitle', () => {
	const items = [
		{ title: 'Lady with an Ermine' },
		{ title: 'Łódź Harbour' },
		{ title: 'Starry Night' }
	];

	it('returns every item for an empty query', () => {
		expect(filterByTitle(items, '  ')).toEqual(items);
	});

	it('matches a fragment of the title without diacritics', () => {
		expect(filterByTitle(items, 'lodz')).toEqual([{ title: 'Łódź Harbour' }]);
	});

	it('matches a fragment in another case', () => {
		expect(filterByTitle(items, 'ERMINE')).toEqual([{ title: 'Lady with an Ermine' }]);
	});

	it('returns nothing when no title matches', () => {
		expect(filterByTitle(items, 'sunflowers')).toEqual([]);
	});
});
