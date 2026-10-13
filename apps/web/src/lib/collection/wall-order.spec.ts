import { afterEach, describe, expect, it, vi } from 'vitest';
import { isWallOrder, rememberedWallOrder, rememberWallOrder } from './wall-order.ts';

function memoryStorage(
	initial: Record<string, string> = {}
): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
	const items = new Map(Object.entries(initial));
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => void items.set(key, value),
		removeItem: (key) => void items.delete(key)
	};
}

function blocked(): never {
	throw new Error('blocked');
}

describe('wall order', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('starts with the most recently added', () => {
		vi.stubGlobal('localStorage', memoryStorage());

		expect(rememberedWallOrder()).toBe('recent');
	});

	it('remembers the order the learner chose', () => {
		vi.stubGlobal('localStorage', memoryStorage());

		rememberWallOrder('period');
		expect(rememberedWallOrder()).toBe('period');

		rememberWallOrder('recent');
		expect(rememberedWallOrder()).toBe('recent');
	});

	it('ignores a stored value it does not know', () => {
		vi.stubGlobal('localStorage', memoryStorage({ 'study-atelier:wall-order': 'oldest' }));

		expect(rememberedWallOrder()).toBe('recent');
	});

	it('falls back to the default when the browser blocks storage', () => {
		vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });

		expect(() => rememberWallOrder('period')).not.toThrow();
		expect(rememberedWallOrder()).toBe('recent');
	});

	it('recognises only the known orders', () => {
		expect(isWallOrder('recent')).toBe(true);
		expect(isWallOrder('period')).toBe(true);
		expect(isWallOrder('oldest')).toBe(false);
		expect(isWallOrder(null)).toBe(false);
	});
});
