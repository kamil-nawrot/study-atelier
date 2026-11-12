import { describe, expect, it } from 'vitest';
import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';
import {
	emptySymbolDraft,
	meaningsToSave,
	moveMeaning,
	newMeaning,
	symbolDraftChanged,
	symbolDraftOf
} from './symbol-draft.ts';

const skull: SymbolEntry = {
	id: 'skull',
	name: 'Czaszka',
	meanings: [
		{ id: 'm1', text: 'przemijanie', contexts: [] },
		{ id: 'm2', text: 'pokuta', contexts: [{ kind: 'text', name: 'pustelnia' }] }
	]
};

describe('symbol draft', () => {
	it('starts with one empty meaning', () => {
		const draft = emptySymbolDraft();

		expect(draft.name).toBe('');
		expect(draft.meanings).toHaveLength(1);
		expect(draft.meanings[0].text).toBe('');
	});

	it('gives every new meaning its own key', () => {
		expect(newMeaning().key).not.toBe(newMeaning().key);
	});

	it('keeps the meanings of a saved symbol with their ids', () => {
		const draft = symbolDraftOf(skull);

		expect(draft.meanings.map((meaning) => meaning.id)).toEqual(['m1', 'm2']);
		expect(symbolDraftOf({ ...skull, meanings: [] }).meanings).toHaveLength(1);
	});

	it('sees a change of the name, a text, a label or the order, but not an empty meaning', () => {
		const saved = symbolDraftOf(skull);

		expect(
			symbolDraftChanged({ ...saved, meanings: [...saved.meanings, newMeaning()] }, saved)
		).toBe(false);
		expect(symbolDraftChanged({ ...saved, name: ' Czaszka ' }, saved)).toBe(false);
		expect(symbolDraftChanged({ ...saved, name: 'Czaszki' }, saved)).toBe(true);
		expect(
			symbolDraftChanged({ ...saved, meanings: moveMeaning(saved.meanings, 0, 1) }, saved)
		).toBe(true);
		const relabelled = saved.meanings.map((meaning, index) =>
			index === 0 ? { ...meaning, contexts: [{ kind: 'text' as const, name: 'barok' }] } : meaning
		);
		expect(symbolDraftChanged({ ...saved, meanings: relabelled }, saved)).toBe(true);
	});

	it('saves only the meanings with a text or a label', () => {
		const empty = newMeaning();
		const labelled = { ...newMeaning(), contexts: [{ kind: 'text' as const, name: 'x' }] };

		expect(meaningsToSave([empty, labelled])).toEqual([labelled]);
	});

	it('moves a meaning up and down, never past the ends', () => {
		const [first, second] = symbolDraftOf(skull).meanings;

		expect(moveMeaning([first, second], 1, -1)).toEqual([second, first]);
		expect(moveMeaning([first, second], 0, -1)).toEqual([first, second]);
		expect(moveMeaning([first, second], 1, 1)).toEqual([first, second]);
	});
});
