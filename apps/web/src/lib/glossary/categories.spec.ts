import { describe, expect, it } from 'vitest';
import BookA from '@lucide/svelte/icons/book-a';
import Images from '@lucide/svelte/icons/images';
import Layers from '@lucide/svelte/icons/layers';
import ListTree from '@lucide/svelte/icons/list-tree';
import { ARTWORK_TYPE_CODES, artworkTypeIcon } from '#lib/catalogue/artwork-types/artwork-types.ts';
import { ERA_CODES, eraIcon } from '#lib/catalogue/eras/eras.ts';
import { placeTiles } from '#lib/catalogue/place-types/place-types.ts';
import { m } from '#lib/i18n/index.ts';
import {
	GLOSSARY_CATEGORIES,
	glossaryCategoryIcon,
	glossaryCategoryName,
	glossaryCategoryTiles,
	isGlossaryCategory
} from './categories.ts';

describe('glossary categories', () => {
	it('gives six tiles with names and icons in the fixed order', () => {
		const tiles = glossaryCategoryTiles();

		expect(tiles.map((tile) => tile.value)).toEqual(GLOSSARY_CATEGORIES);
		expect(tiles.map((tile) => tile.label)).toEqual([
			'Osoba',
			'Architektura',
			'Malarstwo',
			'Rzeźba',
			'Technika i materiał',
			'Pojęcie ogólne'
		]);
		expect(tiles.every((tile) => tile.icon !== undefined && tile.note === undefined)).toBe(true);
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

	it('accepts only the six category codes', () => {
		expect(isGlossaryCategory('person')).toBe(true);
		expect(isGlossaryCategory('general')).toBe(true);
		expect(isGlossaryCategory('applied_arts')).toBe(false);
		expect(isGlossaryCategory(null)).toBe(false);
	});
});
