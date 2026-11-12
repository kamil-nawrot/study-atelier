import { describe, expect, it } from 'vitest';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';
import { matchingExhibitions } from './exhibition-search.ts';

function summary(id: string, title: string): ExhibitionSummary {
	return { id, title, updatedAt: '2020-03-04T10:00:00Z', artworkCount: 1, coverId: null };
}

const exhibitions = [summary('a', 'Światło u Caravaggia'), summary('b', 'Martwa natura')];

describe('matchingExhibitions', () => {
	it('keeps every exhibition for an empty query', () => {
		expect(matchingExhibitions(exhibitions, '  ')).toBe(exhibitions);
	});

	it('matches a fragment of the title without case and diacritics', () => {
		expect(matchingExhibitions(exhibitions, 'SWIATLO').map(({ id }) => id)).toEqual(['a']);
		expect(matchingExhibitions(exhibitions, 'natur').map(({ id }) => id)).toEqual(['b']);
	});

	it('finds nothing when no title has the fragment', () => {
		expect(matchingExhibitions(exhibitions, 'pejzaż')).toEqual([]);
	});
});
