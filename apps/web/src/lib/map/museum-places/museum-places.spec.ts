import { describe, expect, it } from 'vitest';
import type { MuseumPlace } from '#lib/map/types/museum-place.ts';
import { matchMuseums } from './museum-places.ts';

function museum(wikidataId: string, name: string, alias: string | null = null): MuseumPlace {
	return { wikidataId, name, alias, countryCode: 'FR', point: { latitude: 48.8, longitude: 2.1 } };
}

const museums = [
	museum('Q1', 'Galeria Bitew w Wersalu', 'Gallery of Battles'),
	museum('Q2', 'Muzeum Sztuki Nowoczesnej w Paryżu'),
	museum('Q3', 'Muzeum Sztuki Nowoczesnej w Nowym Jorku')
];

describe('matchMuseums', () => {
	it('finds a museum by its name, ignoring case and diacritics', () => {
		expect(
			matchMuseums('galeria bitew w wersalu', museums, 3).map((place) => place.wikidataId)
		).toEqual(['Q1']);
	});

	it('finds a museum by its alias and describes it with its country', () => {
		const [place] = matchMuseums('Gallery of Battles', museums, 3);

		expect(place).toMatchObject({
			wikidataId: 'Q1',
			label: 'Galeria Bitew w Wersalu',
			description: 'Francja',
			latitude: 48.8,
			longitude: 2.1
		});
	});

	it('puts exact matches before partial ones and keeps to the limit', () => {
		const found = matchMuseums('Muzeum Sztuki Nowoczesnej w Paryżu', museums, 3);
		expect(found.map((place) => place.wikidataId)).toEqual(['Q2']);
		expect(matchMuseums('Muzeum Sztuki', museums, 1)).toHaveLength(1);
	});

	it('uses the part before the comma when the whole name has no match', () => {
		expect(matchMuseums('Gallery of Battles, Versailles', museums, 3)[0].wikidataId).toBe('Q1');
	});

	it('does not match on a very short part', () => {
		expect(matchMuseums('Mu', museums, 3)).toEqual([]);
	});
});
