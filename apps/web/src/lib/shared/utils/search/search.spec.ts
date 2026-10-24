import { describe, expect, it } from 'vitest';
import { normalizeForSearch } from './search.ts';

describe('normalizeForSearch', () => {
	it('ignores case, diacritics and surrounding spaces', () => {
		expect(normalizeForSearch('  Żółć ŁĄKA ')).toBe('zolc laka');
	});
});
