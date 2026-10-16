import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { isPlaceType, placeTiles } from './place-types.ts';

describe('place types', () => {
	it('gives four tiles with names and icons', () => {
		const tiles = placeTiles();

		expect(tiles.map((tile) => tile.label)).toEqual([
			m.valueForm.placeTypes.museum,
			m.valueForm.placeTypes.gallery,
			m.valueForm.placeTypes.private_collection,
			m.valueForm.placeTypes.on_site
		]);
		expect(tiles.every((tile) => tile.icon !== undefined && tile.note === undefined)).toBe(true);
	});

	it('accepts only the four types', () => {
		expect(isPlaceType('museum')).toBe(true);
		expect(isPlaceType('gallery')).toBe(true);
		expect(isPlaceType('garden')).toBe(false);
		expect(isPlaceType(null)).toBe(false);
	});
});
