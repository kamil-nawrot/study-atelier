import { describe, expect, it } from 'vitest';
import BookA from '@lucide/svelte/icons/book-a';
import Images from '@lucide/svelte/icons/images';
import Layers from '@lucide/svelte/icons/layers';
import ListTree from '@lucide/svelte/icons/list-tree';
import { ARTWORK_TYPE_CODES, artworkTypeIcon } from '#lib/catalogue/artwork-types/artwork-types.ts';
import { ERA_CODES, eraIcon } from '#lib/catalogue/eras/eras.ts';
import { placeTiles } from '#lib/catalogue/place-types/place-types.ts';
import { m } from '#lib/i18n/i18n.ts';
import {
	categoriesOf,
	FIGURE_CATEGORIES,
	fitsKind,
	GLOSSARY_CATEGORIES,
	glossaryCategoryIcon,
	glossaryCategoryName,
	glossaryCategoryTiles,
	glossaryEntryIcon,
	glossaryEntryLabel,
	isFigure,
	isGlossaryCategory,
	isGlossaryKind,
	TERM_CATEGORIES
} from './categories.ts';

describe('glossary categories', () => {
	it('gives six term tiles with names and icons in the fixed order', () => {
		const tiles = glossaryCategoryTiles('term');

		expect(tiles.map((tile) => tile.value)).toEqual(TERM_CATEGORIES);
		expect(tiles.map((tile) => tile.label)).toEqual([
			'Architektura',
			'Malarstwo',
			'Rzeźba',
			'Technika i materiał',
			'Ikonografia',
			'Pojęcie ogólne'
		]);
		expect(tiles.every((tile) => tile.icon !== undefined && tile.note === undefined)).toBe(true);
	});

	it('gives six figure tiles by role in the fixed order', () => {
		const tiles = glossaryCategoryTiles('figure');

		expect(tiles.map((tile) => tile.value)).toEqual(FIGURE_CATEGORIES);
		expect(tiles.map((tile) => tile.label)).toEqual([
			'Władca',
			'Fundator i mecenas',
			'Artysta',
			'Uczony i badacz',
			'Postać biblijna i święty',
			'Bóstwo i postać mitu'
		]);
	});

	it('tells a figure from a term', () => {
		expect(FIGURE_CATEGORIES.every(isFigure)).toBe(true);
		expect(TERM_CATEGORIES.some(isFigure)).toBe(false);
		expect(fitsKind('myth', 'figure')).toBe(true);
		expect(fitsKind('myth', 'term')).toBe(false);
		expect(fitsKind('iconography', 'term')).toBe(true);
		expect(categoriesOf('figure')).toBe(FIGURE_CATEGORIES);
		expect(categoriesOf('term')).toBe(TERM_CATEGORIES);
		expect(isGlossaryKind('figure')).toBe(true);
		expect(isGlossaryKind('person')).toBe(false);
	});

	it('labels an entry by its category, or by its kind when it has none', () => {
		expect(glossaryEntryLabel({ kind: 'term', category: 'painting' })).toBe('Malarstwo');
		expect(glossaryEntryLabel({ kind: 'term', category: null })).toBe('Pojęcie');
		expect(glossaryEntryLabel({ kind: 'figure', category: null })).toBe('Postać');
		expect(glossaryEntryIcon({ kind: 'figure', category: 'myth' })).toBe(
			glossaryCategoryIcon('myth')
		);
		expect(glossaryEntryIcon({ kind: 'term', category: null })).not.toBe(
			glossaryEntryIcon({ kind: 'figure', category: null })
		);
	});

	it('names every category from the dictionary', () => {
		for (const category of GLOSSARY_CATEGORIES) {
			expect(glossaryCategoryName(category)).toBe(m.glossary.categoryNames[category]);
		}
	});

	it('gives every category an icon used nowhere else in the app', () => {
		const icons = GLOSSARY_CATEGORIES.map(glossaryCategoryIcon);
		const taken = [
			...ERA_CODES.map(eraIcon),
			...ARTWORK_TYPE_CODES.map(artworkTypeIcon),
			...placeTiles().map((tile) => tile.icon),
			BookA,
			Images,
			Layers,
			ListTree
		];

		expect(new Set(icons).size).toBe(icons.length);
		expect(icons.filter((icon) => taken.includes(icon))).toEqual([]);
	});

	it('accepts only the twelve category codes', () => {
		expect(isGlossaryCategory('scholar')).toBe(true);
		expect(isGlossaryCategory('general')).toBe(true);
		expect(isGlossaryCategory('person')).toBe(false);
		expect(isGlossaryCategory('applied_arts')).toBe(false);
		expect(isGlossaryCategory(null)).toBe(false);
	});
});
