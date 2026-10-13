import { describe, expect, it } from 'vitest';
import {
	allowedTypos,
	editDistance,
	findSameValue,
	findSimilarValue,
	suggestValues,
	valueKey
} from './value-suggestions.ts';

describe('valueKey', () => {
	it('ignores case, diacritics and extra spaces', () => {
		expect(valueKey('  Olej   na PŁÓTNIE ')).toBe('olej na plotnie');
	});
});

describe('editDistance', () => {
	it('counts insertions, deletions and substitutions', () => {
		expect(editDistance('gotyk', 'gotyk')).toBe(0);
		expect(editDistance('gotk', 'gotyk')).toBe(1);
		expect(editDistance('gotykk', 'gotyk')).toBe(1);
		expect(editDistance('manet', 'monet')).toBe(1);
		expect(editDistance('', 'tusz')).toBe(4);
	});

	it('counts two swapped letters as one typo', () => {
		expect(editDistance('ogtyk', 'gotyk')).toBe(1);
	});
});

describe('allowedTypos', () => {
	it('allows no typo in short values, one in medium and two in long ones', () => {
		expect(allowedTypos('ara')).toBe(0);
		expect(allowedTypos('brąz')).toBe(1);
		expect(allowedTypos('tempera')).toBe(1);
		expect(allowedTypos('rembrandt')).toBe(2);
	});
});

describe('findSameValue', () => {
	const existing = ['Claude Monet', 'Łódź'];

	it('finds a value that differs only in case, diacritics or spaces', () => {
		expect(findSameValue('claude  MONET', existing)).toBe('Claude Monet');
		expect(findSameValue('lodz', existing)).toBe('Łódź');
	});

	it('finds nothing for a different value or an empty one', () => {
		expect(findSameValue('Claude Manet', existing)).toBeUndefined();
		expect(findSameValue('  ', existing)).toBeUndefined();
	});
});

describe('findSimilarValue', () => {
	it('finds the closest value within the allowed typos', () => {
		expect(findSimilarValue('Rembrnadt', ['Rembrandt', 'Raphael'])).toBe('Rembrandt');
		expect(findSimilarValue('Manet', ['Monet', 'Manetti'])).toBe('Monet');
	});

	it('finds nothing for short values, equal values or distant ones', () => {
		expect(findSimilarValue('ara', ['are'])).toBeUndefined();
		expect(findSimilarValue('monet', ['Monet'])).toBeUndefined();
		expect(findSimilarValue('Picasso', ['Monet'])).toBeUndefined();
	});
});

describe('suggestValues', () => {
	const source = {
		query: '',
		existing: ['Gotyk', 'barok', 'Neogotyk'],
		selected: []
	};

	it('shows used values alphabetically for an empty query', () => {
		expect(suggestValues(source)).toEqual([
			{ kind: 'existing', name: 'barok' },
			{ kind: 'existing', name: 'Gotyk' },
			{ kind: 'existing', name: 'Neogotyk' }
		]);
	});

	it('puts values starting with the query before values containing it, and offers a new value last', () => {
		expect(suggestValues({ ...source, query: 'got' })).toEqual([
			{ kind: 'existing', name: 'Gotyk' },
			{ kind: 'existing', name: 'Neogotyk' },
			{ kind: 'new', name: 'got' }
		]);
	});

	it('matches without diacritics', () => {
		expect(suggestValues({ ...source, query: 'BAROK' })).toEqual([
			{ kind: 'existing', name: 'barok' }
		]);
	});

	it('offers only a new value when nothing is used yet', () => {
		expect(suggestValues({ ...source, existing: [], query: 'Barok' })).toEqual([
			{ kind: 'new', name: 'Barok' }
		]);
	});

	it('offers nothing for an empty query when nothing is used yet', () => {
		expect(suggestValues({ ...source, existing: [] })).toEqual([]);
	});

	it('offers the existing value instead of creating one that differs only in case or diacritics', () => {
		const suggestions = suggestValues({
			...source,
			existing: ['Łódź'],
			query: 'lodz'
		});
		expect(suggestions).toEqual([{ kind: 'existing', name: 'Łódź' }]);
	});

	it('puts a likely typo of an existing value first and still offers the new value', () => {
		expect(suggestValues({ ...source, existing: ['Rembrandt'], query: 'Rembrnadt' })).toEqual([
			{ kind: 'similar', name: 'Rembrandt' },
			{ kind: 'new', name: 'Rembrnadt' }
		]);
	});

	it('does not call a value a typo while the query is still part of it', () => {
		expect(suggestValues({ ...source, existing: ['Monet'], query: 'Mone' })).toEqual([
			{ kind: 'existing', name: 'Monet' },
			{ kind: 'new', name: 'Mone' }
		]);
	});

	it('leaves out values already chosen and offers nothing new for a chosen one', () => {
		expect(suggestValues({ ...source, selected: ['gotyk'], query: 'GOTYK' })).toEqual([
			{ kind: 'existing', name: 'Neogotyk' }
		]);
	});

	it('does not offer a new value that is exactly a suggestion already', () => {
		expect(suggestValues({ ...source, query: 'barok' })).toEqual([
			{ kind: 'existing', name: 'barok' }
		]);
	});

	it('trims the new value', () => {
		expect(suggestValues({ ...source, existing: [], query: '  Fauvism ' })).toEqual([
			{ kind: 'new', name: 'Fauvism' }
		]);
	});
});
