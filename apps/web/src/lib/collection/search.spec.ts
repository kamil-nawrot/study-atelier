import { describe, expect, it } from 'vitest';
import { filterByTitle, normalizeForSearch } from './search.ts';

describe('normalizeForSearch', () => {
	it('ignores case, diacritics and surrounding spaces', () => {
		expect(normalizeForSearch('  Żółć ŁĄKA ')).toBe('zolc laka');
	});
});

describe('filterByTitle', () => {
	const items = [{ title: 'Dama z gronostajem' }, { title: 'Łąka' }, { title: 'Starry Night' }];

	it('returns every item for an empty query', () => {
		expect(filterByTitle(items, '  ')).toEqual(items);
	});

	it('matches a fragment of the title without diacritics', () => {
		expect(filterByTitle(items, 'laka')).toEqual([{ title: 'Łąka' }]);
	});

	it('matches a fragment in another case', () => {
		expect(filterByTitle(items, 'GRONO')).toEqual([{ title: 'Dama z gronostajem' }]);
	});

	it('returns nothing when no title matches', () => {
		expect(filterByTitle(items, 'sunflowers')).toEqual([]);
	});
});
