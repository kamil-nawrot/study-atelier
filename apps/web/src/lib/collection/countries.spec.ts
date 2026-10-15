import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES, countryName, countryOptions, isCountryCode } from './countries.ts';

describe('countries', () => {
	it('lists the 249 ISO 3166-1 codes once each', () => {
		expect(COUNTRY_CODES).toHaveLength(249);
		expect(new Set(COUNTRY_CODES).size).toBe(249);
		expect(COUNTRY_CODES.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
	});

	it('leaves out codes that are not countries today', () => {
		for (const code of ['EU', 'UN', 'SU', 'YU', 'UK', 'XK'])
			expect(isCountryCode(code)).toBe(false);
		expect(isCountryCode('FR')).toBe(true);
	});

	it('names countries in Polish', () => {
		expect(countryName('FR')).toBe('Francja');
		expect(countryName('VA')).toBe('Watykan');
	});

	it('orders the options alphabetically in Polish', () => {
		const labels = countryOptions().map((option) => option.label);
		expect(labels.indexOf('Litwa')).toBeLessThan(labels.indexOf('Łotwa'));
		expect(labels.indexOf('Łotwa')).toBeLessThan(labels.indexOf('Madagaskar'));
	});
});
