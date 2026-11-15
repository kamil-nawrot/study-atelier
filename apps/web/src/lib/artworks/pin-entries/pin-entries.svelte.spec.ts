import { describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { addSymbolMeaning } from '#lib/symbols/symbols-data/symbols-data.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { PinEntries } from './pin-entries.svelte.ts';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ addSymbolMeaning: vi.fn() }));

const KEYS = { id: 'symbol-1', name: 'Keys', meanings: [{ id: 'meaning-1', text: 'Heaven' }] };

describe('PinEntries', () => {
	it('opens the term dialog and resolves with the added term', async () => {
		const entries = new PinEntries(
			() => [testEntry('entry-1', 'Apse')],
			() => []
		);
		const added = entries.newTerm('Nave');
		flushSync();
		expect(entries.termOpen).toBe(true);
		expect(entries.termName).toBe('Nave');

		const nave = testEntry('entry-2', 'Nave');
		entries.termAdded(nave);

		await expect(added).resolves.toBe(nave);
		expect(entries.terms.map((term) => term.id)).toEqual(['entry-1', 'entry-2']);
	});

	it('resolves a symbol dialog left for a new one with nothing', async () => {
		const entries = new PinEntries(
			() => [],
			() => []
		);
		const first = entries.newSymbol('Anchor');
		const second = entries.newSymbol('Lily');
		entries.symbolAdded({ id: 'symbol-2', name: 'Lily', meanings: [] });

		await expect(first).resolves.toBeUndefined();
		await expect(second).resolves.toEqual({ id: 'symbol-2', name: 'Lily', meanings: [] });
		expect(entries.symbolName).toBe('Lily');
	});

	it('adds a meaning to a symbol and keeps it in the list', async () => {
		vi.mocked(addSymbolMeaning).mockResolvedValue({ id: 'meaning-2' });
		const entries = new PinEntries(
			() => [],
			() => [KEYS]
		);

		await expect(entries.addMeaning('symbol-1', 1, 'Power')).resolves.toEqual({
			id: 'meaning-2'
		});

		expect(addSymbolMeaning).toHaveBeenCalledWith('symbol-1', 1, 'Power');
		expect(entries.symbols).toEqual([
			{ ...KEYS, meanings: [...KEYS.meanings, { id: 'meaning-2', text: 'Power' }] }
		]);
	});
});
