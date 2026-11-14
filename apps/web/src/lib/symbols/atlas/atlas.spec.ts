import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtlasSymbol } from '#lib/symbols/types/atlas-symbol.ts';
import { rememberSymbolSort, rememberedSymbolSort, shownSymbols } from './atlas.ts';

function symbol(name: string, createdAt: string, pinCount: number): AtlasSymbol {
	return { id: name, name, createdAt, meaningCount: 1, pinCount };
}

const symbols = [
	symbol('Lilia', '2026-11-03T10:00:00Z', 1),
	symbol('Czaszka', '2026-11-01T10:00:00Z', 3),
	symbol('Łabędź', '2026-11-02T10:00:00Z', 3)
];

function names(shown: AtlasSymbol[]): string[] {
	return shown.map((item) => item.name);
}

describe('shownSymbols', () => {
	it('sorts by name in Polish order', () => {
		expect(names(shownSymbols(symbols, '', 'name'))).toEqual(['Czaszka', 'Lilia', 'Łabędź']);
	});

	it('puts the newest first', () => {
		expect(names(shownSymbols(symbols, '', 'recent'))).toEqual(['Lilia', 'Łabędź', 'Czaszka']);
	});

	it('puts the symbols with the most details first, then by name', () => {
		expect(names(shownSymbols(symbols, '', 'details'))).toEqual(['Czaszka', 'Łabędź', 'Lilia']);
	});

	it('finds a symbol by a fragment of its name, without accents', () => {
		expect(names(shownSymbols(symbols, 'labe', 'name'))).toEqual(['Łabędź']);
	});
});

describe('symbol sort', () => {
	beforeEach(() => {
		const items = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => items.get(key) ?? null,
			setItem: (key: string, value: string) => void items.set(key, value)
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('starts alphabetically and remembers the choice', () => {
		expect(rememberedSymbolSort()).toBe('name');
		rememberSymbolSort('details');
		expect(rememberedSymbolSort()).toBe('details');
	});
});
