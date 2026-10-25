import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import {
	UNKNOWN_AUTHOR,
	applyFilter,
	clearField,
	emptyFilter,
	filterFromParams,
	filterOptions,
	filterTags,
	favouriteCount,
	filterToParams,
	isEmptyFilter,
	matchesFilter,
	onlyFavourites,
	pruneFilter,
	removeTag,
	ownFilterOptions,
	setOwnText,
	setYears,
	tagLabel,
	tagParts,
	tickedOptions,
	toggleFavourites,
	toggleOwnValue,
	toggleTicked,
	toggleValue
} from './filter.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

const artworks: WallArtwork[] = [
	testArtwork(1, 'Girl with a Pearl Earring', {
		authors: ['Vermeer'],
		yearTo: 1665,
		eraCode: 'early_modern',
		typeCode: 'painting',
		period: 'Dutch Golden Age',
		styles: ['Baroque'],
		materials: ['Oil'],
		location: 'Mauritshuis'
	}),
	testArtwork(2, 'Mona Lisa', {
		authors: ['Leonardo'],
		yearTo: 1503,
		eraCode: 'early_modern',
		typeCode: 'painting',
		period: 'Renaissance',
		styles: ['Sfumato', 'Renaissance'],
		materials: ['Oil', 'Poplar'],
		location: 'Louvre'
	}),
	testArtwork(3, 'Venus of Willendorf', {
		authors: [],
		yearTo: -25000,
		eraCode: 'prehistory',
		typeCode: 'sculpture',
		hasImage: false
	}),
	testArtwork(4, 'Untitled', {
		authors: ['Vermeer', 'Leonardo'],
		yearTo: null,
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

	it('keeps a year span that overlaps the year range', () => {
		const spans = [
			testArtwork(5, 'Sistine Chapel ceiling', { yearFrom: 1508, yearTo: 1512 }),
			testArtwork(6, 'Augustus of Prima Porta', { yearFrom: -20, yearTo: 20 }),
			testArtwork(7, 'Night Watch', { yearFrom: null, yearTo: 1642 })
		];
		const kept = (range: Partial<CollectionFilter>): number[] =>
			applyFilter(spans, filterWith(range)).map((artwork) => artwork.number);

		expect(kept({ yearFrom: 1510, yearTo: 1600 })).toEqual([5]);
		expect(kept({ yearFrom: 1400, yearTo: 1508 })).toEqual([5]);
		expect(kept({ yearFrom: 1513 })).toEqual([7]);
		expect(kept({ yearTo: -1 })).toEqual([6]);
		expect(kept({ yearFrom: 1, yearTo: 1000 })).toEqual([6]);
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
	it('orders authors with the same count by their sort name', () => {
		const artworks = [
			testArtwork(1, 'Soup Cans', { authors: ['Andy Warhol'], authorSortNames: ['Warhol, Andy'] }),
			testArtwork(2, 'The Kiss', { authors: ['Gustav Klimt'], authorSortNames: ['Klimt, Gustav'] })
		];

		expect(filterOptions(artworks, emptyFilter(), 'authors').map((option) => option.value)).toEqual(
			['Gustav Klimt', 'Andy Warhol']
		);
	});

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

	it('names the field and the value of a tag apart', () => {
		const [painting, years] = filterTags(
			filterWith({ types: ['painting'], yearFrom: 1400, yearTo: 1700 })
		);

		expect(tagParts(painting)).toEqual({
			field: m.atelier.filters.tagFields.types,
			value: m.artworkTypes.painting
		});
		expect(tagParts(years)).toEqual({
			field: m.atelier.filters.tagFields.years,
			value: m.atelier.filters.yearsBetween(1400, 1700)
		});
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

		expect(params.getAll('era')).toEqual(['early_modern', 'modern']);
		expect(params.get('year')).toBe('-500..1700');
		expect(filterFromParams(new URLSearchParams(params.toString()))).toEqual(filter);
	});

	it('ignores a link saved with the old Polish names and any unknown parameter', () => {
		expect(
			filterFromParams(
				new URLSearchParams('epoka=modern&typ=painting&ulubione=1&bez-autora=1&colour=%ZZ&era=')
			)
		).toEqual(emptyFilter());
	});

	it('turns the favourites and the unknown author on only with 1', () => {
		expect(filterFromParams(new URLSearchParams('favourites=0&unknown-author=false'))).toEqual(
			emptyFilter()
		);
		expect(filterFromParams(new URLSearchParams('favourites=1&unknown-author=1'))).toMatchObject({
			favourites: true,
			unknownAuthor: true
		});
	});

	it('is empty for an empty filter', () => {
		expect(filterToParams(emptyFilter()).toString()).toBe('');
		expect(filterFromParams(new URLSearchParams())).toEqual(emptyFilter());
	});

	it('writes an open year range with one end', () => {
		const params = filterToParams(filterWith({ yearTo: 1700 }));

		expect(params.get('year')).toBe('..1700');
		expect(filterFromParams(params)).toMatchObject({ yearFrom: null, yearTo: 1700 });
	});

	it('ignores unknown eras, types and missing data and a broken year range', () => {
		const params = new URLSearchParams(
			'era=nope&era=modern&type=nope&missing=nope&missing=era&year=abc..12x&style=&style=Baroque&style=Baroque'
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

describe('favourites', () => {
	const marked = [
		testArtwork(1, 'Mona Lisa', { favourite: true, eraCode: 'early_modern' }),
		testArtwork(2, 'The Kiss', { favourite: true, eraCode: 'modern' }),
		testArtwork(3, 'Sunflowers', { eraCode: 'modern' })
	];

	it('shows only the favourites', () => {
		const result = applyFilter(marked, filterWith({ favourites: true }));

		expect(result.map((artwork) => artwork.title)).toEqual(['Mona Lisa', 'The Kiss']);
	});

	it('combines with the other fields', () => {
		const result = applyFilter(marked, filterWith({ favourites: true, eras: ['modern'] }));

		expect(result.map((artwork) => artwork.title)).toEqual(['The Kiss']);
	});

	it('counts the favourites the wall would show with the other filters', () => {
		expect(favouriteCount(marked, emptyFilter())).toBe(2);
		expect(favouriteCount(marked, filterWith({ eras: ['modern'] }))).toBe(1);
		expect(favouriteCount(marked, filterWith({ favourites: true, eras: ['modern'] }))).toBe(1);
	});

	it('toggles, clears and knows when it is the only choice', () => {
		const on = toggleFavourites(emptyFilter());

		expect(on.favourites).toBe(true);
		expect(isEmptyFilter(on)).toBe(false);
		expect(onlyFavourites(on)).toBe(true);
		expect(onlyFavourites({ ...on, eras: ['modern'] })).toBe(false);
		expect(clearField(on, 'favourites').favourites).toBe(false);
		expect(toggleFavourites(on)).toEqual(emptyFilter());
	});

	it('has a tag that names the field only and removes the choice', () => {
		const [tag] = filterTags(filterWith({ favourites: true }));

		expect(tag).toEqual({ id: 'favourites', field: 'favourites', value: '' });
		expect(tagParts(tag)).toEqual({ field: m.atelier.filters.tagFields.favourites, value: '' });
		expect(tagLabel(tag)).toBe(m.atelier.filters.tagFields.favourites);
		expect(removeTag(filterWith({ favourites: true }), tag)).toEqual(emptyFilter());
	});

	it('is kept in the address', () => {
		const filter = filterWith({ favourites: true });
		const params = filterToParams(filter);

		expect(params.get('favourites')).toBe('1');
		expect(filterFromParams(params)).toEqual(filter);
		expect(filterToParams(emptyFilter()).has('favourites')).toBe(false);
	});
});

describe('own fields', () => {
	const fields: OwnFieldDefinition[] = [
		{ id: 'lecture', name: 'Lecture', description: null, kind: 'list', multiple: false },
		{ id: 'source', name: 'Source', description: null, kind: 'text', multiple: false },
		{ id: 'seen', name: 'Seen in person', description: null, kind: 'flag', multiple: false },
		{ id: 'exam', name: 'For the exam', description: null, kind: 'flag', multiple: false }
	];
	const own: WallArtwork[] = [
		testArtwork(1, 'Annunciation', {
			own: { lecture: ['Renaissance class'], source: 'Gombrich, Story of Art', seen: true }
		}),
		testArtwork(2, 'Night Watch', {
			own: { lecture: ['Baroque class'], seen: true, exam: true }
		}),
		testArtwork(3, 'Las Meninas', { own: { lecture: ['Baroque class'], source: 'Lecture notes' } })
	];
	const titles = (filter: CollectionFilter): string[] =>
		applyFilter(own, filter).map((artwork) => artwork.title);

	it('matches any chosen value of a list', () => {
		const filter = toggleOwnValue(
			toggleOwnValue(emptyFilter(), 'lecture', 'Renaissance class'),
			'lecture',
			'Baroque class'
		);

		expect(titles(filter)).toEqual(['Annunciation', 'Night Watch', 'Las Meninas']);
		expect(titles(toggleOwnValue(filter, 'lecture', 'Baroque class'))).toEqual(['Annunciation']);
	});

	it('matches a text that contains the typed text anywhere, ignoring case and diacritics', () => {
		expect(titles(setOwnText(emptyFilter(), 'source', 'STÓRY'))).toEqual(['Annunciation']);
		expect(titles(setOwnText(emptyFilter(), 'source', '  '))).toHaveLength(3);
	});

	it('matches only artworks with every chosen tick', () => {
		const seen = toggleTicked(emptyFilter(), 'seen');

		expect(titles(seen)).toEqual(['Annunciation', 'Night Watch']);
		expect(titles(toggleTicked(seen, 'exam'))).toEqual(['Night Watch']);
		expect(titles(toggleTicked(seen, 'seen'))).toHaveLength(3);
	});

	it('counts the values of a list on the artworks the rest of the filter leaves', () => {
		const filter = toggleTicked(emptyFilter(), 'seen');

		expect(ownFilterOptions(own, filter, 'lecture')).toEqual([
			{ value: 'Baroque class', count: 1 },
			{ value: 'Renaissance class', count: 1 }
		]);
		expect(ownFilterOptions(own, emptyFilter(), 'lecture')[0]).toEqual({
			value: 'Baroque class',
			count: 2
		});
	});

	it('counts each tick together with the ticks already chosen', () => {
		expect(tickedOptions(own, emptyFilter(), fields)).toEqual([
			{ value: 'seen', count: 2 },
			{ value: 'exam', count: 1 }
		]);
		expect(tickedOptions(own, toggleTicked(emptyFilter(), 'exam'), fields)).toEqual([
			{ value: 'seen', count: 1 },
			{ value: 'exam', count: 1 }
		]);
	});

	it('is not empty and not favourites only while an own field is chosen', () => {
		const ticked = toggleTicked(toggleFavourites(emptyFilter()), 'seen');

		expect(isEmptyFilter(toggleTicked(emptyFilter(), 'seen'))).toBe(false);
		expect(onlyFavourites(ticked)).toBe(false);
	});

	it('puts tags of own fields before the missing data and removes them one by one', () => {
		let filter = toggleOwnValue(emptyFilter(), 'lecture', 'Baroque class');
		filter = setOwnText(filter, 'source', ' gomb ');
		filter = toggleTicked(filter, 'seen');
		filter = toggleValue(filter, 'missing', 'image');

		const tags = filterTags(filter, fields);

		expect(tags.map((tag) => tagParts(tag))).toEqual([
			{ field: 'Lecture', value: 'Baroque class' },
			{ field: 'Source', value: 'gomb' },
			{ field: 'Seen in person', value: '' },
			{ field: m.atelier.filters.tagFields.missing, value: m.atelier.filters.missing.image }
		]);
		const cleared = tags.slice(0, 3).reduce(removeTag, filter);
		expect(filterTags(cleared, fields)).toHaveLength(1);
	});

	it('keeps own fields in the address by their ids and ignores unknown parameters', () => {
		let filter = toggleOwnValue(emptyFilter(), 'lecture', 'Baroque class');
		filter = setOwnText(filter, 'source', 'gomb');
		filter = toggleTicked(filter, 'seen');

		const params = filterToParams(filter);

		expect(params.toString()).toBe('field.lecture=Baroque+class&text.source=gomb&ticked=seen');
		expect(filterFromParams(new URLSearchParams(`${params}&colour=red`))).toEqual(filter);
	});

	it('keeps own choices and names their tags in general when the fields could not be loaded', () => {
		const filter = toggleTicked(toggleOwnValue(emptyFilter(), 'lecture', 'Baroque class'), 'seen');

		expect(pruneFilter(filter, own)).toEqual(filter);
		expect(filterTags(filter).map((tag) => tagParts(tag))).toEqual([
			{ field: m.atelier.filters.ownField, value: 'Baroque class' },
			{ field: m.atelier.filters.ownField, value: '' }
		]);
	});

	it('drops own fields that no longer exist and values no artwork has', () => {
		let filter = toggleOwnValue(emptyFilter(), 'lecture', 'Gone class');
		filter = toggleOwnValue(filter, 'lecture', 'Baroque class');
		filter = toggleOwnValue(filter, 'deleted', 'Value');
		filter = setOwnText(filter, 'deleted-text', 'x');
		filter = toggleTicked(toggleTicked(filter, 'seen'), 'deleted-tick');

		const pruned = pruneFilter(filter, own, fields);

		expect(pruned.own).toEqual({ lecture: ['Baroque class'] });
		expect(pruned.ownTexts).toEqual({});
		expect(pruned.ticked).toEqual(['seen']);
	});
});
