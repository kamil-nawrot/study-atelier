import { describe, expect, it } from 'vitest';
import {
	artworkGroup,
	isConfidentArtwork,
	preferredGroup,
	typeDistance,
	yearDistance
} from './artwork-confidence.ts';
import type { ClassGroup } from '#lib/images/types/class-group.ts';
import type { WikidataArtwork } from '#lib/images/types/wikidata-artwork.ts';

const PAINTING = 'Q3305213';
const CATHEDRAL = 'Q2977';
const TOWN = 'Q3957';
const FILM = 'Q11424';

const groups = new Map<string, ClassGroup | null>([
	[PAINTING, 'artwork'],
	[CATHEDRAL, 'building'],
	[TOWN, null],
	[FILM, null]
]);

function item(overrides: Partial<WikidataArtwork>): WikidataArtwork {
	return {
		wikidataId: 'Q1',
		title: 'Byblos',
		creators: [],
		creatorNames: [],
		hasCreator: false,
		date: null,
		file: 'Byblos.jpg',
		types: [],
		inCollection: false,
		isClass: false,
		...overrides
	};
}

describe('isConfidentArtwork', () => {
	it('keeps an artwork or a building', () => {
		expect(isConfidentArtwork(item({ types: [PAINTING] }), groups)).toBe(true);
		expect(isConfidentArtwork(item({ types: [TOWN, CATHEDRAL] }), groups)).toBe(true);
	});

	it('drops a town, a film or a type it does not know', () => {
		expect(isConfidentArtwork(item({ types: [TOWN] }), groups)).toBe(false);
		expect(isConfidentArtwork(item({ types: [FILM] }), groups)).toBe(false);
		expect(isConfidentArtwork(item({ types: ['Q999'] }), groups)).toBe(false);
	});

	it('keeps an object of another type when it has a creator or sits in a collection', () => {
		expect(isConfidentArtwork(item({ types: ['Q191576'], inCollection: true }), groups)).toBe(true);
		expect(isConfidentArtwork(item({ types: [TOWN], hasCreator: true }), groups)).toBe(true);
	});

	it('keeps an item without any type, since nothing says it is not an artwork', () => {
		expect(isConfidentArtwork(item({ types: [] }), groups)).toBe(true);
	});

	it('drops a general concept unless it has a creator or a collection', () => {
		expect(isConfidentArtwork(item({ types: [CATHEDRAL], isClass: true }), groups)).toBe(false);
		expect(isConfidentArtwork(item({ isClass: true }), groups)).toBe(false);
		expect(
			isConfidentArtwork(item({ types: [PAINTING], isClass: true, hasCreator: true }), groups)
		).toBe(true);
	});
});

describe('artworkGroup', () => {
	it('prefers the artwork group when an item is both', () => {
		expect(artworkGroup(item({ types: [CATHEDRAL, PAINTING] }), groups)).toBe('artwork');
		expect(artworkGroup(item({ types: [CATHEDRAL] }), groups)).toBe('building');
		expect(artworkGroup(item({ types: [TOWN] }), groups)).toBeNull();
	});
});

describe('preferredGroup', () => {
	it('prefers buildings for architecture and artworks for the other types', () => {
		expect(preferredGroup('architecture')).toBe('building');
		expect(preferredGroup('sculpture')).toBe('artwork');
		expect(preferredGroup('')).toBeNull();
	});
});

describe('typeDistance', () => {
	it('puts the group of the form first and treats every item alike without a type', () => {
		const church = item({ types: [CATHEDRAL] });
		expect(typeDistance(church, groups, 'building')).toBe(0);
		expect(typeDistance(church, groups, 'artwork')).toBe(1);
		expect(typeDistance(church, groups, null)).toBe(0);
	});
});

describe('yearDistance', () => {
	it('measures how far the year of the item is from the typed year', () => {
		const dated = item({ date: { year: 1658, precision: 9 } });
		expect(yearDistance(dated, 1660)).toBe(2);
		expect(yearDistance(dated, null)).toBe(0);
		expect(yearDistance(item({}), 1660)).toBe(Number.POSITIVE_INFINITY);
	});
});
