import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { isPlaceType, placeTiles, placeTypeIcon } from './place-types.ts';

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

	it('gives the icon of a type as on its tile', () => {
		const museum = placeTiles().find((tile) => tile.value === 'museum');

		expect(placeTypeIcon('museum')).toBe(museum?.icon);
	});

	it('accepts only the four types', () => {
		expect(isPlaceType('museum')).toBe(true);
		expect(isPlaceType('gallery')).toBe(true);
		expect(isPlaceType('garden')).toBe(false);
		expect(isPlaceType(null)).toBe(false);
	});
});
