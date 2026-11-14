import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isGlossaryTab, rememberGlossaryTab, rememberedGlossaryTab } from './glossary-tab.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
	const items = new Map<string, string>();
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => void items.set(key, value)
	};
}

describe('glossary tab', () => {
	beforeEach(() => {
		vi.stubGlobal('sessionStorage', memoryStorage());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('opens the terms first', () => {
		expect(rememberedGlossaryTab()).toBe('terms');
	});

	it('remembers the tab for the session', () => {
		rememberGlossaryTab('symbols');

		expect(rememberedGlossaryTab()).toBe('symbols');
	});

	it('ignores a tab it does not know', () => {
		rememberGlossaryTab('timeline');

		expect(rememberedGlossaryTab()).toBe('terms');
		expect(isGlossaryTab('symbols')).toBe(true);
	});
});
