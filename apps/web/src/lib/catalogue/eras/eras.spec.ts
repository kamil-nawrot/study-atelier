import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { ERA_CODES, eraName, eraTiles, isEraCode } from './eras.ts';

describe('ERA_CODES', () => {
	it('lists the six eras from the oldest to the newest', () => {
		expect(ERA_CODES).toEqual([
			'prehistory',
			'antiquity',
			'middle_ages',
			'early_modern',
			'modern',
			'contemporary'
		]);
	});
});

describe('isEraCode', () => {
	it('accepts the code of an era and nothing else', () => {
		expect(isEraCode('modern')).toBe(true);
		expect(isEraCode('stone_age')).toBe(false);
		expect(isEraCode(null)).toBe(false);
		expect(isEraCode(undefined)).toBe(false);
	});
});

describe('eraName', () => {
	it('reads the name of an era from the app texts', () => {
		expect(eraName('middle_ages')).toBe(m.eras.middle_ages.name);
	});
});

describe('eraTiles', () => {
	it('gives every era a tile with its name, years and an icon, in order', () => {
		const tiles = eraTiles();

		expect(tiles.map((tile) => tile.value)).toEqual([...ERA_CODES]);
		expect(tiles.map((tile) => tile.label)).toEqual(ERA_CODES.map((code) => m.eras[code].name));
		expect(tiles.map((tile) => tile.note)).toEqual(ERA_CODES.map((code) => m.eras[code].years));
		expect(tiles.every((tile) => tile.icon !== undefined)).toBe(true);
	});
});
