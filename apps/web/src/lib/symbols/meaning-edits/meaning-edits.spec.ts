import { describe, expect, it } from 'vitest';
import { testSymbol } from '#lib/testing/symbols/symbols.ts';
import { canAddMeaning, withMeaning, withMovedMeaning, withoutMeaning } from './meaning-edits.ts';

describe('meaning edits', () => {
	it('adds a meaning after the existing ones', () => {
		const draft = withMeaning(testSymbol, { text: 'danger', contexts: [] });

		expect(draft.name).toBe('Skull');
		expect(draft.meanings.map((meaning) => meaning.text)).toEqual([
			'transience, death',
			'penance',
			'danger'
		]);
		expect(draft.meanings[2].id).toBeUndefined();
	});

	it('changes the text and the contexts of one meaning', () => {
		const draft = withMeaning(testSymbol, { text: 'repentance', contexts: [] }, 'penance');

		expect(draft.meanings.map((meaning) => meaning.text)).toEqual([
			'transience, death',
			'repentance'
		]);
		expect(draft.meanings[1].id).toBe('penance');
		expect(draft.meanings[1].contexts).toEqual([]);
	});

	it('removes one meaning', () => {
		expect(withoutMeaning(testSymbol, 'transience').meanings.map((meaning) => meaning.id)).toEqual([
			'penance'
		]);
	});

	it('moves a meaning one place and stays put at the ends', () => {
		expect(
			withMovedMeaning(testSymbol, 'penance', -1).meanings.map((meaning) => meaning.id)
		).toEqual(['penance', 'transience']);
		expect(
			withMovedMeaning(testSymbol, 'penance', 1).meanings.map((meaning) => meaning.id)
		).toEqual(['transience', 'penance']);
	});

	it('stops offering new meanings at the limit', () => {
		const full = {
			...testSymbol,
			meanings: Array.from({ length: 10 }, (_, index) => ({
				id: `m${index}`,
				text: `meaning ${index}`,
				contexts: []
			}))
		};

		expect(canAddMeaning(testSymbol)).toBe(true);
		expect(canAddMeaning(full)).toBe(false);
	});
});
