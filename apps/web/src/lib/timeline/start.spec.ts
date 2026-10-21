import { afterEach, describe, expect, it, vi } from 'vitest';
import { busiestEra, eraOfYear, rememberEra, rememberedEra, startEra } from './start.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
	const items = new Map<string, string>();
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => void items.set(key, value)
	};
}

describe('startEra', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('opens the era looked at last on the device', () => {
		vi.stubGlobal('localStorage', memoryStorage());
		rememberEra('antiquity');

		expect(startEra([{ yearTo: 1500 }], rememberedEra())).toBe('antiquity');
	});

	it('opens the era with the most dated artworks the first time', () => {
		vi.stubGlobal('localStorage', memoryStorage());

		expect(
			startEra(
				[{ yearTo: -2500 }, { yearTo: -450 }, { yearTo: 1503 }, { yearTo: null }],
				rememberedEra()
			)
		).toBe('antiquity');
	});

	it('ignores a blocked storage', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('blocked');
			}
		});

		expect(rememberedEra()).toBeNull();
	});

	it('falls back to the early modern era without dated artworks', () => {
		expect(busiestEra([{ yearTo: null }])).toBe('early_modern');
	});
});

describe('eraOfYear', () => {
	it('finds the era a year falls in', () => {
		expect(eraOfYear(-4)).toBe('antiquity');
		expect(eraOfYear(1492)).toBe('early_modern');
		expect(eraOfYear(1815)).toBe('modern');
	});

	it('takes a year before prehistory starts as prehistory and a future year as the last era', () => {
		expect(eraOfYear(-43500)).toBe('prehistory');
		expect(eraOfYear(3000)).toBe('contemporary');
	});
});
