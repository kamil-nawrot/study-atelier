import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import type { ImageCandidate } from '#lib/images/types.ts';
import { isCandidateImage, matchKey, matchLabel, matchPool } from './auto-match.ts';

function candidate(wikidataId: string, overrides: Partial<ImageCandidate> = {}): ImageCandidate {
	return {
		wikidataId,
		title: 'Discobolus',
		authors: ['Myron'],
		date: '450 p.n.e.',
		image: {
			file: `${wikidataId}.jpg`,
			src: 'https://example.com/thumb.jpg',
			width: 400,
			height: 500,
			licence: null,
			licenceUrl: null,
			attribution: null
		},
		...overrides
	};
}

describe('matchPool', () => {
	it('takes the candidates that match an author', () => {
		const candidates = [candidate('Q1'), candidate('Q2')];

		expect(matchPool({ candidates, authorMatch: true }, false)).toEqual(candidates);
	});

	it('takes nothing when no candidate matches the authors', () => {
		expect(matchPool({ candidates: [candidate('Q1')], authorMatch: false }, false)).toEqual([]);
	});

	it('takes a single result for an unknown author, and nothing when there are more', () => {
		expect(matchPool({ candidates: [candidate('Q1')], authorMatch: false }, true)).toHaveLength(1);
		expect(
			matchPool({ candidates: [candidate('Q1'), candidate('Q2')], authorMatch: false }, true)
		).toEqual([]);
	});

	it('takes nothing when the search failed', () => {
		expect(matchPool({ candidates: [], error: 'offline' }, true)).toEqual([]);
	});
});

describe('matchLabel', () => {
	it('names the title, the authors and the date, leaving out what is missing', () => {
		expect(matchLabel(candidate('Q1'))).toBe(
			m.artworkForm.matchFound('Discobolus · Myron · 450 p.n.e.')
		);
		expect(matchLabel(candidate('Q1', { authors: [], date: undefined }))).toBe(
			m.artworkForm.matchFound('Discobolus')
		);
	});
});

describe('matchKey and isCandidateImage', () => {
	it('ignores spaces around the title', () => {
		expect(matchKey(' Discobolus ', ['Myron'])).toBe(matchKey('Discobolus', ['Myron']));
	});

	it('recognises the image of a candidate', () => {
		const image = {
			kind: 'commons' as const,
			wikidataId: 'Q1',
			file: 'Q1.jpg',
			licence: null,
			licenceUrl: null,
			attribution: null,
			width: 400,
			height: 500
		};
		expect(isCandidateImage(image, candidate('Q1'))).toBe(true);
		expect(isCandidateImage(image, candidate('Q2'))).toBe(false);
		expect(isCandidateImage(null, candidate('Q1'))).toBe(false);
	});
});
