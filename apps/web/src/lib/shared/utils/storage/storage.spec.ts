import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStored, readStoredJson, readStoredStrings, writeStored } from './storage.ts';

const KEY = 'study-atelier:test';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
	const items = new Map<string, string>();
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => void items.set(key, value),
		removeItem: (key) => void items.delete(key)
	};
}

function blocked(): never {
	throw new Error('blocked');
}

describe('storage', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', memoryStorage());
		vi.stubGlobal('sessionStorage', memoryStorage());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('writes, reads and removes a value in the chosen storage', () => {
		writeStored('session', KEY, 'stored');
		expect(readStored('session', KEY)).toBe('stored');
		expect(readStored('local', KEY)).toBeNull();
		writeStored('session', KEY, null);
		expect(readStored('session', KEY)).toBeNull();
	});

	it('reads a JSON value and gives null for a broken or missing one', () => {
		writeStored('local', KEY, JSON.stringify({ order: 'year' }));
		expect(readStoredJson('local', KEY)).toEqual({ order: 'year' });
		writeStored('local', KEY, '{broken');
		expect(readStoredJson('local', KEY)).toBeNull();
		expect(readStoredJson('session', KEY)).toBeNull();
	});

	it('reads a list of strings and leaves out what is not one', () => {
		writeStored('local', KEY, JSON.stringify(['one', 2, 'three', null]));
		expect(readStoredStrings('local', KEY)).toEqual(['one', 'three']);
		writeStored('local', KEY, JSON.stringify({ one: true }));
		expect(readStoredStrings('local', KEY)).toEqual([]);
		expect(readStoredStrings('session', KEY)).toEqual([]);
	});

	it('ignores a storage that throws', () => {
		vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
		expect(readStored('local', KEY)).toBeNull();
		expect(() => writeStored('local', KEY, 'value')).not.toThrow();
		expect(() => writeStored('local', KEY, null)).not.toThrow();
	});
});
