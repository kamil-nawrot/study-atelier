import { beforeEach, describe, expect, it } from 'vitest';
import { rememberedVisitSort, rememberVisitSort } from './visit-sort.ts';

describe('remembered visit sort', () => {
	const stored = new Map<string, string>();

	beforeEach(() => {
		stored.clear();
		globalThis.localStorage = {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: (key: string, value: string) => void stored.set(key, value),
			removeItem: (key: string) => void stored.delete(key)
		} as Storage;
	});

	it('starts with the newest visits', () => {
		expect(rememberedVisitSort()).toBe('newest');
	});

	it('remembers the chosen order', () => {
		rememberVisitSort('oldest');
		expect(rememberedVisitSort()).toBe('oldest');
	});

	it('ignores a stored value it does not know', () => {
		stored.set('study-atelier:chronicle-sort', 'alphabetical');
		expect(rememberedVisitSort()).toBe('newest');
	});
});
