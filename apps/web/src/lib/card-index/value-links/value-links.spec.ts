import { describe, expect, it } from 'vitest';
import { emptyValueLinks } from './value-links.ts';

describe('emptyValueLinks', () => {
	it('has an empty list of periods for every era and no styles', () => {
		const links = emptyValueLinks();

		expect(Object.keys(links.periodsByEra)).toEqual([
			'prehistory',
			'antiquity',
			'middle_ages',
			'early_modern',
			'modern',
			'contemporary'
		]);
		expect(Object.values(links.periodsByEra).flat()).toEqual([]);
		expect(links.stylesByPeriod).toEqual({});
	});
});
