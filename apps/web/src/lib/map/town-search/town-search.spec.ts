import { describe, expect, it } from 'vitest';
import type { Town } from '#lib/map/types/town.ts';
import { namesakeRegion, searchTowns } from './town-search.ts';

function town(name: string, countryCode: string, extra: Partial<Town> = {}): Town {
	return { name, countryCode, longitude: 0, latitude: 0, ...extra };
}

const munich = town('Monachium', 'DE', { otherNames: ['Munich'], region: 'Bayern' });
const london = town('Londyn', 'GB', { otherNames: ['London'] });
const lodz = town('Łódź', 'PL');
const toledoSpain = town('Toledo', 'ES', { region: 'Castilla-La Mancha' });
const toledoOhio = town('Toledo', 'US', { region: 'Ohio' });
const alexandriaVirginia = town('Alexandria', 'US', { region: 'Virginia' });
const alexandriaLouisiana = town('Alexandria', 'US', { region: 'Louisiana' });
const towns = [
	munich,
	london,
	lodz,
	toledoSpain,
	toledoOhio,
	alexandriaVirginia,
	alexandriaLouisiana
];

describe('searchTowns', () => {
	it('finds a town by its Polish name, its original name or its English name', () => {
		expect(searchTowns('monach', towns)).toEqual([munich]);
		expect(searchTowns('munich', towns)).toEqual([munich]);
		expect(searchTowns('London', towns)).toEqual([london]);
	});

	it('ignores case and Polish diacritics', () => {
		expect(searchTowns('lodz', towns)).toEqual([lodz]);
		expect(searchTowns('ŁÓDŹ', towns)).toEqual([lodz]);
	});

	it('puts names that start with the query before names that only contain it', () => {
		const lyon = town('Lyon', 'FR');
		const avalon = town('Avalon', 'US');
		expect(searchTowns('lon', [avalon, lyon, london])).toEqual([london, avalon]);
	});

	it('finds nothing for an empty query and keeps to the limit', () => {
		expect(searchTowns('  ', towns)).toEqual([]);
		expect(searchTowns('a', towns, 2)).toHaveLength(2);
	});
});

describe('namesakeRegion', () => {
	it('names the region only when another suggestion shares the name and the country', () => {
		const shown = [toledoSpain, toledoOhio, alexandriaVirginia, alexandriaLouisiana];
		expect(namesakeRegion(toledoSpain, shown)).toBeNull();
		expect(namesakeRegion(toledoOhio, shown)).toBeNull();
		expect(namesakeRegion(alexandriaVirginia, shown)).toBe('Virginia');
		expect(namesakeRegion(alexandriaLouisiana, shown)).toBe('Louisiana');
	});
});
