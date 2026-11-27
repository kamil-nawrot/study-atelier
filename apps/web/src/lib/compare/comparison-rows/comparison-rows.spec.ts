import { describe, expect, it } from 'vitest';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import { m } from '#lib/i18n/i18n.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import { comparisonRows, fieldValues, wikidataOf } from './comparison-rows.ts';

function side(overrides: Partial<ComparedSide>): ComparedSide {
	return { ...emptyArtworkInput(), title: 'A', ...overrides };
}

const FIELD: OwnFieldDefinition = {
	id: 'technique',
	name: 'Technika',
	description: null,
	kind: 'text',
	multiple: false,
	closed: false,
	typeCodes: []
};

describe('comparisonRows', () => {
	it('lists the fields of both artworks side by side', () => {
		const rows = comparisonRows(
			side({ authors: ['Vermeer'], yearTo: 1665, eraCode: 'early_modern', typeCode: 'painting' }),
			side({ authorUnknown: true, styles: ['barok'] }),
			[]
		);

		expect(rows.map((row) => row.label)).toEqual([
			m.artworkForm.authors,
			m.artworkForm.year,
			m.artworkForm.era,
			m.artworkForm.type,
			m.artworkForm.period,
			m.artworkForm.style,
			m.artworkForm.material,
			m.artworkForm.location,
			m.compare.wikidata
		]);
		expect(rows[0]).toMatchObject({
			left: [{ text: 'Vermeer' }],
			right: [{ text: m.ui.unknownAuthor }]
		});
		expect(rows[1]).toMatchObject({ left: [{ text: '1665' }], right: [] });
		expect(rows[5]).toMatchObject({ left: [], right: [{ text: 'barok' }] });
	});

	it('adds the own fields that either artwork fills', () => {
		const rows = comparisonRows(side({ own: { technique: 'olej' } }), side({}), [
			FIELD,
			{ ...FIELD, id: 'empty', name: 'Puste' }
		]);

		expect(rows.find((row) => row.key === 'own:technique')).toMatchObject({
			label: 'Technika',
			left: [{ text: 'olej' }],
			right: []
		});
		expect(rows.some((row) => row.key === 'own:empty')).toBe(false);
	});
});

describe('fieldValues', () => {
	it('gives the date in the usual form', () => {
		expect(
			fieldValues(
				'date',
				side({ yearFrom: 29500, fromBeforeCommonEra: true, yearTo: 25000, toBeforeCommonEra: true })
			)
		).toHaveLength(1);
	});
});

describe('wikidataOf', () => {
	it('reads the Wikidata id of the first image that has one', () => {
		expect(
			wikidataOf(
				side({
					image: { kind: 'url', url: 'https://example.org/a.jpg', width: 1, height: 1 },
					images: [
						{
							kind: 'commons',
							wikidataId: 'Q42',
							file: 'A.jpg',
							licence: null,
							licenceUrl: null,
							attribution: null,
							width: 1,
							height: 1
						}
					]
				})
			)
		).toBe('Q42');
		expect(wikidataOf(side({}))).toBeNull();
	});
});
