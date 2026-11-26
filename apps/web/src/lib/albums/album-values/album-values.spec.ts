import { describe, expect, it } from 'vitest';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';
import type { LearnerValue } from '#lib/albums/types/learner-value.ts';
import { matchAlbumValue, sameName } from './album-values.ts';

function albumValue(overrides: Partial<AlbumValue> = {}): AlbumValue {
	return {
		id: 'limestone',
		revision: 1,
		category: 'material',
		wikidataId: null,
		birthYear: null,
		deathYear: null,
		yearsApproximate: false,
		countryCode: null,
		placeType: null,
		name: 'wapień oolitowy',
		alternativeNames: [],
		summary: null,
		description: null,
		country: null,
		...overrides
	};
}

function learner(name: string, overrides: Partial<LearnerValue> = {}): LearnerValue {
	return { category: 'material', name, wikidataId: null, ...overrides };
}

describe('sameName', () => {
	it('ignores letter case and spaces around', () => {
		expect(sameName(' Wapień ', 'wapień')).toBe(true);
		expect(sameName('wapień', 'wapienie')).toBe(false);
	});
});

describe('matchAlbumValue', () => {
	it('takes the learner value with the same Wikidata id, whatever its name', () => {
		const value = albumValue({ category: 'author', name: 'Jan van Eyck', wikidataId: 'Q102272' });

		expect(
			matchAlbumValue(value, [
				learner('Jan van Eyck', { category: 'author' }),
				learner('van Eyck', { category: 'author', wikidataId: 'Q102272' })
			])
		).toEqual({ name: 'van Eyck', isNew: false });
	});

	it('takes the learner value with the same name ignoring letter case', () => {
		expect(matchAlbumValue(albumValue(), [learner('Wapień Oolitowy')])).toEqual({
			name: 'Wapień Oolitowy',
			isNew: false
		});
	});

	it('takes the learner value named like one of the alternative names', () => {
		const value = albumValue({ alternativeNames: ['wapień'] });

		expect(matchAlbumValue(value, [learner('Wapień')])).toEqual({ name: 'Wapień', isNew: false });
	});

	it('prefers the same name to an alternative name', () => {
		const value = albumValue({ alternativeNames: ['wapień'] });

		expect(matchAlbumValue(value, [learner('wapień'), learner('wapień oolitowy')])).toEqual({
			name: 'wapień oolitowy',
			isNew: false
		});
	});

	it('does not guess by a similar name and marks the value as new', () => {
		expect(matchAlbumValue(albumValue(), [learner('wapień')])).toEqual({
			name: 'wapień oolitowy',
			isNew: true
		});
	});

	it('matches only values of the same category', () => {
		expect(
			matchAlbumValue(albumValue(), [learner('wapień oolitowy', { category: 'style' })])
		).toEqual({ name: 'wapień oolitowy', isNew: true });
	});
});
