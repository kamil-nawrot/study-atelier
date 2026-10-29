import { afterEach, describe, expect, it, vi } from 'vitest';
import { artworkPanelOpen, rememberArtworkPanel } from './artwork-panel.ts';

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

describe('artwork panel', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('is open until the learner closes it', () => {
		vi.stubGlobal('localStorage', memoryStorage());

		expect(artworkPanelOpen()).toBe(true);

		rememberArtworkPanel(false);
		expect(artworkPanelOpen()).toBe(false);

		rememberArtworkPanel(true);
		expect(artworkPanelOpen()).toBe(true);
	});

	it('stays open when the browser blocks storage', () => {
		vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });

		expect(() => rememberArtworkPanel(false)).not.toThrow();
		expect(artworkPanelOpen()).toBe(true);
	});
});
