import { describe, expect, it } from 'vitest';
import { sameEraAndYears, yearOutsideEra } from './era-fit.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

function outside(
	eraCode: EraCode | null,
	yearTo: number | null,
	yearFrom: number | null = null
): boolean {
	return yearOutsideEra({ eraCode, yearFrom, yearTo });
}

describe('yearOutsideEra', () => {
	it('asks when a year falls outside its era', () => {
		expect(outside('middle_ages', 1650)).toBe(true);
		expect(outside('prehistory', -2500)).toBe(true);
		expect(outside('contemporary', 1900)).toBe(true);
	});

	it('lets a range through when it shares a year with the era', () => {
		expect(outside('early_modern', 1520, 1480)).toBe(false);
		expect(outside('middle_ages', 1700, 1650)).toBe(true);
	});

	it('counts a boundary year in both eras', () => {
		expect(outside('middle_ages', 1492)).toBe(false);
		expect(outside('early_modern', 1492)).toBe(false);
		expect(outside('antiquity', -3000)).toBe(false);
		expect(outside('prehistory', -3000)).toBe(false);
	});

	it('gives prehistory no lower bound and the contemporary era no upper bound', () => {
		expect(outside('prehistory', -25000)).toBe(false);
		expect(outside('contemporary', 2500)).toBe(false);
	});

	it('does not ask without an era or a year', () => {
		expect(outside(null, 1650)).toBe(false);
		expect(outside('middle_ages', null)).toBe(false);
	});
});

describe('sameEraAndYears', () => {
	it('tells whether the era or a year changed', () => {
		const saved = { eraCode: 'middle_ages' as const, yearFrom: null, yearTo: 1650 };
		expect(sameEraAndYears(saved, { ...saved })).toBe(true);
		expect(sameEraAndYears(saved, { ...saved, yearTo: 1651 })).toBe(false);
		expect(sameEraAndYears(saved, { ...saved, yearFrom: 1600 })).toBe(false);
		expect(sameEraAndYears(saved, { ...saved, eraCode: 'early_modern' })).toBe(false);
	});
});
