import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { ERA_CODES, eraName, eraTiles, eraYears, isEraCode } from './eras.ts';

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

describe('eraYears', () => {
	const today = new Date('2026-11-04T12:00:00.000Z');

	it('spans an era from its first year to the first year of the next one', () => {
		expect(eraYears('early_modern', today)).toEqual([1492, 1789]);
		expect(eraYears('antiquity', today)).toEqual([-3000, 476]);
	});

	it('starts prehistory at 40 000 BCE and ends the contemporary era in the current year', () => {
		expect(eraYears('prehistory', today)).toEqual([-40000, -3000]);
		expect(eraYears('contemporary', today)).toEqual([1945, 2026]);
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
