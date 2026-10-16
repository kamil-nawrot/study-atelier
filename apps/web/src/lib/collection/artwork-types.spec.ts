import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import {
	ARTWORK_TYPE_CODES,
	artworkTypeIcon,
	artworkTypeTiles,
	isArtworkTypeCode
} from './artwork-types.ts';
import { eraIcon, ERA_CODES } from './eras.ts';
import { placeTiles } from './place-types.ts';

describe('artwork types', () => {
	it('gives eight tiles with names and icons in the fixed order', () => {
		const tiles = artworkTypeTiles();

		expect(tiles.map((tile) => tile.value)).toEqual(ARTWORK_TYPE_CODES);
		expect(tiles.map((tile) => tile.label)).toEqual(
			ARTWORK_TYPE_CODES.map((code) => m.artworkTypes[code])
		);
		expect(tiles.every((tile) => tile.icon !== undefined && tile.note === undefined)).toBe(true);
	});

	it('gives every type its own icon, used by no era and no type of place', () => {
		const icons = ARTWORK_TYPE_CODES.map(artworkTypeIcon);
		const taken = [...ERA_CODES.map(eraIcon), ...placeTiles().map((tile) => tile.icon)];

		expect(new Set(icons).size).toBe(icons.length);
		expect(icons.filter((icon) => taken.includes(icon))).toEqual([]);
	});

	it('gives no era the icon of a type of place', () => {
		const eraIcons = ERA_CODES.map(eraIcon);
		const placeIcons = placeTiles().map((tile) => tile.icon);

		expect(new Set(placeIcons).size).toBe(placeIcons.length);
		expect(placeIcons.filter((icon) => eraIcons.includes(icon))).toEqual([]);
	});

	it('accepts only the eight type codes', () => {
		expect(isArtworkTypeCode('painting')).toBe(true);
		expect(isArtworkTypeCode('applied_arts')).toBe(true);
		expect(isArtworkTypeCode('tapestry')).toBe(false);
		expect(isArtworkTypeCode(null)).toBe(false);
	});
});
