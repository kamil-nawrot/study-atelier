import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import {
	UNKNOWN_AUTHOR,
	applyFilter,
	clearField,
	emptyFilter,
	filterFromParams,
	filterOptions,
	filterTags,
	filterToParams,
	isEmptyFilter,
	matchesFilter,
	pruneFilter,
	removeTag,
	setYears,
	tagLabel,
	toggleValue
} from './filter.ts';
import type { CollectionFilter, WallArtwork } from './types.ts';

const artworks: WallArtwork[] = [
	testArtwork(1, 'Girl with a Pearl Earring', {
		authors: ['Vermeer'],
		year: 1665,
		eraCode: 'early_modern',
		typeCode: 'painting',
		period: 'Dutch Golden Age',
		styles: ['Baroque'],
		materials: ['Oil'],
		location: 'Mauritshuis'
	}),
	testArtwork(2, 'Mona Lisa', {
		authors: ['Leonardo'],
		year: 1503,
		eraCode: 'early_modern',
		typeCode: 'painting',
		period: 'Renaissance',
		styles: ['Sfumato', 'Renaissance'],
		materials: ['Oil', 'Poplar'],
		location: 'Louvre'
	}),
	testArtwork(3, 'Venus of Willendorf', {
		authors: [],
		year: -25000,
		eraCode: 'prehistory',
		typeCode: 'sculpture',
		hasImage: false
	}),
	testArtwork(4, 'Untitled', {
		authors: ['Vermeer', 'Leonardo'],
		year: null,
		eraCode: null
	})
];

function numbers(filter: CollectionFilter): number[] {
	return applyFilter(artworks, filter).map((artwork) => artwork.number);
}

function filterWith(changes: Partial<CollectionFilter>): CollectionFilter {
	return { ...emptyFilter(), ...changes };
}

describe('applyFilter', () => {
	it('returns every artwork for an empty filter', () => {
		expect(numbers(emptyFilter())).toEqual([1, 2, 3, 4]);
	});

	it('matches an artwork that has any of the chosen values of a field', () => {
		expect(numbers(filterWith({ eras: ['prehistory', 'early_modern'] }))).toEqual([1, 2, 3]);
	});

	it('matches an artwork that has any of several values of a multi-value field', () => {
		expect(numbers(filterWith({ styles: ['Baroque', 'Sfumato'] }))).toEqual([1, 2]);
	});

	it('requires a match in every field that has a choice', () => {
		expect(numbers(filterWith({ eras: ['early_modern'], materials: ['Poplar'] }))).toEqual([2]);
	});

	it('matches any of the authors of an artwork with several authors', () => {
		expect(numbers(filterWith({ authors: ['Leonardo'] }))).toEqual([2, 4]);
	});

	it('matches an artwork without authors as an unknown author', () => {
		expect(numbers(filterWith({ unknownAuthor: true }))).toEqual([3]);
		expect(numbers(filterWith({ unknownAuthor: true, authors: ['Vermeer'] }))).toEqual([1, 3, 4]);
	});

	it('matches the type, period and location', () => {
		expect(numbers(filterWith({ types: ['sculpture'] }))).toEqual([3]);
		expect(numbers(filterWith({ periods: ['Renaissance'] }))).toEqual([2]);
		expect(numbers(filterWith({ locations: ['Louvre', 'Mauritshuis'] }))).toEqual([1, 2]);
	});

	it('keeps the artworks inside a year range and leaves out those without a year', () => {
		expect(numbers(filterWith({ yearFrom: 1500, yearTo: 1700 }))).toEqual([1, 2]);
		expect(numbers(filterWith({ yearFrom: 1600 }))).toEqual([1]);
		expect(numbers(filterWith({ yearTo: 0 }))).toEqual([3]);
	});

	it('finds what is missing', () => {
		expect(numbers(filterWith({ missing: ['image'] }))).toEqual([3]);
		expect(numbers(filterWith({ missing: ['year'] }))).toEqual([4]);
		expect(numbers(filterWith({ missing: ['era'] }))).toEqual([4]);
		expect(numbers(filterWith({ missing: ['period'] }))).toEqual([3, 4]);
		expect(numbers(filterWith({ missing: ['type'] }))).toEqual([4]);
		expect(numbers(filterWith({ missing: ['image', 'year'] }))).toEqual([3, 4]);
	});
});

describe('matchesFilter', () => {
	it('ignores the skipped field', () => {
		const filter = filterWith({ eras: ['prehistory'], styles: ['Baroque'] });

		expect(matchesFilter(artworks[0], filter)).toBe(false);
		expect(matchesFilter(artworks[0], filter, 'eras')).toBe(true);
	});
});

describe('filterOptions', () => {
	it('counts the artworks the wall would show with each value of a field', () => {
		expect(filterOptions(artworks, emptyFilter(), 'materials')).toEqual([
			{ value: 'Oil', count: 2 },
			{ value: 'Poplar', count: 1 }
		]);
	});

	it('counts with the other fields but not with its own field', () => {
		const filter = filterWith({ eras: ['prehistory'], materials: ['Poplar'] });

		expect(filterOptions(artworks, filter, 'eras')).toEqual([
			{ value: 'prehistory', count: 0 },
			{ value: 'early_modern', count: 1 }
		]);
	});

	it('keeps a chosen value that no artwork has', () => {
		const filter = filterWith({ styles: ['Gothic'] });

		expect(filterOptions(artworks, filter, 'styles')).toContainEqual({ value: 'Gothic', count: 0 });
	});

	it('lists values by number of artworks, then by name', () => {
		expect(filterOptions(artworks, emptyFilter(), 'authors').map((option) => option.value)).toEqual(
			['Leonardo', 'Vermeer', UNKNOWN_AUTHOR]
		);
	});

	it('puts eras, types and missing data in their fixed order', () => {
		expect(filterOptions(artworks, emptyFilter(), 'eras').map((option) => option.value)).toEqual([
			'prehistory',
			'early_modern'
		]);
		expect(filterOptions(artworks, emptyFilter(), 'missing')).toEqual([
			{ value: 'image', count: 1 },
			{ value: 'year', count: 1 },
			{ value: 'era', count: 1 },
			{ value: 'period', count: 2 },
			{ value: 'type', count: 1 }
		]);
	});

	it('counts the unknown author', () => {
		expect(filterOptions(artworks, emptyFilter(), 'authors')).toContainEqual({
			value: UNKNOWN_AUTHOR,
			count: 1
		});
	});
});

describe('changing a filter', () => {
	it('adds and removes a value', () => {
		const added = toggleValue(emptyFilter(), 'styles', 'Baroque');

		expect(added.styles).toEqual(['Baroque']);
		expect(toggleValue(added, 'styles', 'Baroque').styles).toEqual([]);
	});

	it('toggles the unknown author without touching the names', () => {
		const filter = toggleValue(filterWith({ authors: ['Vermeer'] }), 'authors', UNKNOWN_AUTHOR);

		expect(filter).toMatchObject({ authors: ['Vermeer'], unknownAuthor: true });
		expect(toggleValue(filter, 'authors', UNKNOWN_AUTHOR).unknownAuthor).toBe(false);
	});

	it('sets and clears the years', () => {
		const filter = setYears(emptyFilter(), -500, 100);

		expect(filter).toMatchObject({ yearFrom: -500, yearTo: 100 });
		expect(clearField(filter, 'years')).toEqual(emptyFilter());
	});

	it('clears one field and leaves the others', () => {
		const filter = filterWith({ styles: ['Baroque'], eras: ['modern'], unknownAuthor: true });

		expect(clearField(filter, 'authors')).toEqual(
			filterWith({ styles: ['Baroque'], eras: ['modern'] })
		);
		expect(clearField(filter, 'styles').eras).toEqual(['modern']);
	});

	it('knows when it is empty', () => {
		expect(isEmptyFilter(emptyFilter())).toBe(true);
		expect(isEmptyFilter(filterWith({ unknownAuthor: true }))).toBe(false);
		expect(isEmptyFilter(filterWith({ yearTo: 10 }))).toBe(false);
	});
});

describe('filter tags', () => {
	it('lists one tag per chosen value and one for the years', () => {
		const filter = filterWith({
			eras: ['early_modern'],
			styles: ['Baroque', 'Gothic'],
			yearFrom: 1400,
			yearTo: 1700,
			unknownAuthor: true
		});

		expect(filterTags(filter).map((tag) => tag.id)).toEqual([
			'eras:early_modern',
			'years',
			`authors:${UNKNOWN_AUTHOR}`,
			'styles:Baroque',
			'styles:Gothic'
		]);
	});

	it('names a tag after its field and value', () => {
		const tags = filterTags(
			filterWith({
				eras: ['early_modern'],
				types: ['painting'],
				missing: ['year'],
				yearFrom: -500,
				yearTo: null,
				unknownAuthor: true,
				locations: ['Louvre']
			})
		);

		expect(tags.map(tagLabel)).toEqual([
			`${m.atelier.filters.tagFields.eras} ${m.eras.early_modern.name}`,
			`${m.atelier.filters.tagFields.types} ${m.artworkTypes.painting}`,
			`${m.atelier.filters.tagFields.years} ${m.atelier.filters.yearsFrom(-500)}`,
			`${m.atelier.filters.tagFields.authors} ${m.atelier.filters.unknownAuthor}`,
			`${m.atelier.filters.tagFields.locations} Louvre`,
			`${m.atelier.filters.tagFields.missing} ${m.atelier.filters.missing.year}`
		]);
	});

	it('removes the value of a tag', () => {
		const filter = filterWith({ styles: ['Baroque', 'Gothic'], yearFrom: 1400, yearTo: 1700 });
		const [years, baroque] = filterTags(filter);

		expect(removeTag(filter, baroque).styles).toEqual(['Gothic']);
		expect(removeTag(filter, years)).toMatchObject({ yearFrom: null, yearTo: null });
	});
});

describe('the filter in the address', () => {
	const filter = filterWith({
		eras: ['early_modern', 'modern'],
		types: ['painting'],
		yearFrom: -500,
		yearTo: 1700,
		authors: ['Vermeer & Co, "the Delft"'],
		unknownAuthor: true,
		periods: ['Renaissance'],
		styles: ['Baroque', 'Mannerism'],
		materials: ['Oil'],
		locations: ['Louvre'],
		missing: ['image', 'year']
	});

	it('is written as a readable query and read back unchanged', () => {
		const params = filterToParams(filter);

		expect(params.getAll('epoka')).toEqual(['early_modern', 'modern']);
		expect(params.get('rok')).toBe('-500..1700');
		expect(filterFromParams(new URLSearchParams(params.toString()))).toEqual(filter);
	});

	it('is empty for an empty filter', () => {
		expect(filterToParams(emptyFilter()).toString()).toBe('');
		expect(filterFromParams(new URLSearchParams())).toEqual(emptyFilter());
	});

	it('writes an open year range with one end', () => {
		const params = filterToParams(filterWith({ yearTo: 1700 }));

		expect(params.get('rok')).toBe('..1700');
		expect(filterFromParams(params)).toMatchObject({ yearFrom: null, yearTo: 1700 });
	});

	it('ignores unknown eras, types and missing data and a broken year range', () => {
		const params = new URLSearchParams(
			'epoka=nope&epoka=modern&typ=nope&braki=nope&braki=era&rok=abc..12x&styl=&styl=Baroque&styl=Baroque'
		);

		expect(filterFromParams(params)).toEqual(
			filterWith({ eras: ['modern'], missing: ['era'], styles: ['Baroque'] })
		);
	});

	it('drops names that no artwork has', () => {
		const pruned = pruneFilter(
			filterWith({ styles: ['Baroque', 'Gone'], authors: ['Nobody'], eras: ['modern'] }),
			artworks
		);

		expect(pruned).toEqual(filterWith({ styles: ['Baroque'], eras: ['modern'] }));
	});
});
