import { describe, expect, it } from 'vitest';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { Town } from '#lib/map/types/town.ts';
import { cityOfTown, cityOptions, ownCities } from './city-options.ts';

function town(name: string, countryCode: string, extra: Partial<Town> = {}): Town {
	return { name, countryCode, longitude: 2, latitude: 48, ...extra };
}

function place(id: string, name: string, extra: Partial<CardIndexRecord> = {}): CardIndexRecord {
	return { id, category: 'location', name, count: 0, ...extra };
}

const paris = place('paris', 'Paryż', { placeType: 'city', countryCode: 'FR' });
const torun = place('torun', 'Toruń', { placeType: 'city', countryCode: 'PL' });
const louvre = place('louvre', 'Luwr', { placeType: 'museum', countryCode: 'FR' });
const towns = [
	town('Paryż', 'FR', { wikidataId: 'Q90', otherNames: ['Paris'] }),
	town('Toledo', 'ES', { wikidataId: 'Q5836', region: 'Castilla-La Mancha' }),
	town('Toledo', 'US', { wikidataId: 'Q49239', region: 'Ohio' }),
	town('Alexandria', 'US', { region: 'Virginia' }),
	town('Alexandria', 'US', { region: 'Louisiana' }),
	town('Prisztina', 'KOS')
];

describe('ownCities', () => {
	it('keeps only the places of the type city, without the place itself, by name', () => {
		expect(ownCities([torun, louvre, paris], 'torun')).toEqual([paris]);
		expect(ownCities([torun, louvre, paris]).map((city) => city.name)).toEqual(['Paryż', 'Toruń']);
	});
});

describe('cityOptions', () => {
	it('shows the learner’s cities first and each catalogue town once', () => {
		const { options } = cityOptions('to', [paris, torun], towns);
		expect(options.map((option) => [option.kind, option.name, option.note])).toEqual([
			['existing', 'Toruń', 'Polska'],
			['starter', 'Toledo', 'Hiszpania'],
			['starter', 'Toledo', 'Stany Zjednoczone'],
			['new', 'to', undefined]
		]);
	});

	it('does not offer a catalogue town the atelier already has, by any of its names', () => {
		const { options } = cityOptions('paris', [paris], towns);
		expect(options.filter((option) => option.kind === 'starter')).toEqual([]);
		expect(cityOptions('Paryż', [paris], towns).options.map((option) => option.kind)).toEqual([
			'existing'
		]);
	});

	it('adds the region only for namesakes in one country', () => {
		const { options } = cityOptions('alexandria', [], towns);
		expect(options.map((option) => option.note)).toEqual([
			'Virginia, Stany Zjednoczone',
			'Louisiana, Stany Zjednoczone'
		]);
	});

	it('offers a new city only when no city or town has that name', () => {
		expect(cityOptions('Tum', [], towns).options).toEqual([
			{ kind: 'new', id: 'new', name: 'Tum' }
		]);
		expect(cityOptions('toledo', [], towns).options.some((option) => option.kind === 'new')).toBe(
			false
		);
		expect(cityOptions('', [paris], towns).options.map((option) => option.name)).toEqual(['Paryż']);
	});

	it('remembers what every option stands for', () => {
		const { options, choices } = cityOptions('tole', [], towns);
		expect(choices.get(options[0].id ?? '')).toEqual({
			name: 'Toledo',
			countryCode: 'ES',
			point: { latitude: 48, longitude: 2 },
			wikidataId: 'Q5836'
		});
		expect(choices.get('new')).toEqual({ name: 'tole' });
	});
});

describe('cityOfTown', () => {
	it('drops a country code the app does not know', () => {
		expect(cityOfTown(town('Prisztina', 'KOS')).countryCode).toBeNull();
	});
});
