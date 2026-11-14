import { describe, expect, it } from 'vitest';
import { matchingSymbols, symbolOf } from './symbol-search.ts';

const symbols = [
	{ id: 'star', name: 'Gwiazda', meanings: [] },
	{ id: 'skull', name: 'Czaszka', meanings: [] },
	{ id: 'lily', name: 'Lilia', meanings: [] },
	{ id: 'swallow', name: 'Jaskółka', meanings: [] }
];

describe('symbol search', () => {
	it('lists symbols from A to Z before a phrase is typed', () => {
		expect(matchingSymbols(symbols, ' ').map((symbol) => symbol.id)).toEqual([
			'skull',
			'star',
			'swallow',
			'lily'
		]);
		expect(matchingSymbols(symbols, '', 2)).toHaveLength(2);
	});

	it('finds symbols ignoring case and Polish letters, names that start with the phrase first', () => {
		expect(matchingSymbols(symbols, 'JASKOL').map((symbol) => symbol.id)).toEqual(['swallow']);
		expect(matchingSymbols(symbols, 'li').map((symbol) => symbol.id)).toEqual(['lily']);
		expect(matchingSymbols(symbols, 'a').map((symbol) => symbol.id)).toEqual([
			'skull',
			'star',
			'swallow',
			'lily'
		]);
	});

	it('finds a symbol by its id', () => {
		expect(symbolOf(symbols, 'lily')?.name).toBe('Lilia');
		expect(symbolOf(undefined, 'lily')).toBeUndefined();
	});
});
