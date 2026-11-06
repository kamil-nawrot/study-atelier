import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import {
	ERA_CODES,
	eraName,
	eraTiles,
	eraYears,
	eraYearsText,
	isEraCode,
	yearOutsideEra
} from './eras.ts';

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

describe('eraYearsText', () => {
	const moved = [-3000, 476, 1560, 1789, 1945];

	it('writes the years of an era from the learner junctions', () => {
		expect(eraYearsText('early_modern', moved)).toBe(
			m.atelier.yearRange(m.atelier.year(1560, false), m.atelier.year(1789, false))
		);
		expect(eraYearsText('prehistory', moved)).toBe(m.eraYears.until(m.atelier.year(-3000, false)));
		expect(eraYearsText('contemporary', moved)).toBe(m.eraYears.from(m.atelier.year(1945, false)));
	});
});

describe('yearOutsideEra', () => {
	const moved = [-3000, 476, 1560, 1789, 1945];
	const dated = (
		yearFrom: number | null,
		yearTo: number | null
	): { eraCode: 'early_modern'; yearFrom: number | null; yearTo: number | null } => ({
		eraCode: 'early_modern' as const,
		yearFrom,
		yearTo
	});

	it('finds an artwork dated wholly outside the bounds of its era', () => {
		expect(yearOutsideEra(dated(null, 1503), moved)).toBe(true);
		expect(yearOutsideEra(dated(1800, 1810), moved)).toBe(true);
		expect(yearOutsideEra(dated(1550, 1570), moved)).toBe(false);
		expect(yearOutsideEra(dated(null, 1600), moved)).toBe(false);
	});

	it('leaves out an artwork without an era or a year', () => {
		expect(yearOutsideEra(dated(null, null), moved)).toBe(false);
		expect(yearOutsideEra({ eraCode: null, yearFrom: null, yearTo: 1503 }, moved)).toBe(false);
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
		expect(tiles.map((tile) => tile.note)).toEqual(ERA_CODES.map((code) => eraYearsText(code)));
		expect(tiles.every((tile) => tile.icon !== undefined)).toBe(true);
	});
});
