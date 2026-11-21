import { beforeEach, describe, expect, it } from 'vitest';
import { rememberSort, rememberedSort, sortRecords, sortsOf } from './card-index-sort.ts';

function names(records: { name: string }[]): string[] {
	return records.map((record) => record.name);
}

describe('sortsOf', () => {
	it('offers the oldest and the newest first for the timeline, authors and events', () => {
		expect(sortsOf('timeline')).toEqual(['name', 'count', 'oldest', 'newest']);
		expect(sortsOf('author')).toEqual(['name', 'count', 'oldest', 'newest']);
		expect(sortsOf('location')).toEqual(['name', 'count']);
		expect(sortsOf('events')).toEqual(['name', 'oldest', 'newest']);
		expect(sortsOf('material')).toEqual(['name', 'count']);
	});
});

describe('sortRecords', () => {
	it('sorts by the sort name, then by name', () => {
		const sorted = sortRecords(
			[
				{ name: 'Vincent van Gogh', sortName: 'Gogh, Vincent van' },
				{ name: 'Albrecht Dürer', sortName: 'Dürer, Albrecht' }
			],
			'name'
		);

		expect(names(sorted)).toEqual(['Albrecht Dürer', 'Vincent van Gogh']);
	});

	it('puts the most used first and keeps the name order for a tie', () => {
		const sorted = sortRecords(
			[
				{ name: 'Brąz', count: 2 },
				{ name: 'Marmur', count: 5 },
				{ name: 'Alabaster', count: 2 }
			],
			'count'
		);

		expect(names(sorted)).toEqual(['Marmur', 'Alabaster', 'Brąz']);
	});

	it('sorts authors by the year of birth with the unknown ones last', () => {
		const sorted = sortRecords(
			[
				{ name: 'Anonim' },
				{ name: 'Rembrandt', birthYear: 1606 },
				{ name: 'Giotto', birthYear: 1267 }
			],
			'oldest'
		);

		expect(names(sorted)).toEqual(['Giotto', 'Rembrandt', 'Anonim']);
	});

	it('sorts authors from the newest with the unknown ones last', () => {
		const sorted = sortRecords(
			[
				{ name: 'Anonim' },
				{ name: 'Giotto', birthYear: 1267 },
				{ name: 'Rembrandt', birthYear: 1606 }
			],
			'newest'
		);

		expect(names(sorted)).toEqual(['Rembrandt', 'Giotto', 'Anonim']);
	});

	it('sorts periods and styles by the year of their oldest artwork', () => {
		const records = [
			{ name: 'Barok', firstYear: 1600 },
			{ name: 'Bez dzieł' },
			{ name: 'Gotyk', firstYear: -50 },
			{ name: 'Renesans', firstYear: 1450 }
		];

		expect(names(sortRecords(records, 'oldest'))).toEqual([
			'Gotyk',
			'Renesans',
			'Barok',
			'Bez dzieł'
		]);
		expect(names(sortRecords(records, 'newest'))).toEqual([
			'Barok',
			'Renesans',
			'Gotyk',
			'Bez dzieł'
		]);
	});

	it('sorts places by country, then by name, with places without a country last', () => {
		const sorted = sortRecords(
			[
				{ name: 'Uffizi', country: 'Włochy' },
				{ name: 'Pracownia' },
				{ name: 'Orsay', country: 'Francja' },
				{ name: 'Luwr', country: 'Francja' }
			],
			'country'
		);

		expect(names(sorted)).toEqual(['Luwr', 'Orsay', 'Uffizi', 'Pracownia']);
	});

	it('sorts events by their year with undated ones last', () => {
		const sorted = sortRecords(
			[
				{ name: 'Bez daty' },
				{ name: 'Sobór', year: 1545 },
				{ name: 'Odkrycie Ameryki', year: 1492 }
			],
			'oldest'
		);

		expect(names(sorted)).toEqual(['Odkrycie Ameryki', 'Sobór', 'Bez daty']);
	});
});

describe('rememberedSort', () => {
	const stored = new Map<string, string>();

	beforeEach(() => {
		stored.clear();
		globalThis.localStorage = {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: (key: string, value: string) => void stored.set(key, value),
			removeItem: (key: string) => void stored.delete(key)
		} as Storage;
	});

	it('remembers the sort of each tab and falls back to the name', () => {
		rememberSort('author', 'newest');
		rememberSort('location', 'count');

		expect(rememberedSort('author')).toBe('newest');
		expect(rememberedSort('location')).toBe('count');
		expect(rememberedSort('material')).toBe('name');
	});

	it('ignores a sort the tab does not offer', () => {
		rememberSort('material', 'newest');

		expect(rememberedSort('material')).toBe('name');
	});
});
