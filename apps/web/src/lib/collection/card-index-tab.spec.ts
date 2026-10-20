import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rememberCardIndexTab, rememberedCardIndexTab } from './card-index-tab.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
	const items = new Map<string, string>();
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => void items.set(key, value)
	};
}

describe('card index tab', () => {
	beforeEach(() => {
		vi.stubGlobal('sessionStorage', memoryStorage());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('starts on the timeline', () => {
		expect(rememberedCardIndexTab()).toBe('timeline');
	});

	it('remembers the last tab', () => {
		rememberCardIndexTab('author');

		expect(rememberedCardIndexTab()).toBe('author');
	});

	it('ignores a value that is not a tab', () => {
		rememberCardIndexTab('trash');

		expect(rememberedCardIndexTab()).toBe('timeline');
	});

	it('falls back to the timeline when the storage is blocked', () => {
		vi.stubGlobal('sessionStorage', {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			}
		});

		rememberCardIndexTab('author');

		expect(rememberedCardIndexTab()).toBe('timeline');
	});
});
