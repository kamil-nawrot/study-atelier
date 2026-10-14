import { afterEach, describe, expect, it, vi } from 'vitest';
import { neighboursIn, rememberedWallSequence, rememberWallSequence } from './wall-sequence.ts';

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

const SEQUENCE = { query: 'epoka=early_modern', numbers: [12, 7, 30] };

describe('wall sequence', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('remembers the artworks of the wall in their order with its filter', () => {
		vi.stubGlobal('sessionStorage', memoryStorage());

		rememberWallSequence(SEQUENCE);

		expect(rememberedWallSequence()).toEqual(SEQUENCE);
	});

	it('has no sequence before the wall was shown', () => {
		vi.stubGlobal('sessionStorage', memoryStorage());

		expect(rememberedWallSequence()).toBeUndefined();
	});

	it('ignores a stored value that is not a sequence', () => {
		vi.stubGlobal(
			'sessionStorage',
			memoryStorage({ 'study-atelier:wall-sequence': '{"query":1,"numbers":["a"]}' })
		);

		expect(rememberedWallSequence()).toBeUndefined();
	});

	it('ignores a stored value that is not JSON', () => {
		vi.stubGlobal('sessionStorage', memoryStorage({ 'study-atelier:wall-sequence': '[' }));

		expect(rememberedWallSequence()).toBeUndefined();
	});

	it('works without storage', () => {
		vi.stubGlobal('sessionStorage', {
			getItem: blocked,
			setItem: blocked,
			removeItem: blocked
		});

		expect(() => rememberWallSequence(SEQUENCE)).not.toThrow();
		expect(rememberedWallSequence()).toBeUndefined();
	});
});

describe('neighboursIn', () => {
	it('finds the artworks before and after one in the middle', () => {
		expect(neighboursIn(SEQUENCE, 7)).toEqual({ previous: 12, next: 30 });
	});

	it('has no previous artwork for the first and no next for the last', () => {
		expect(neighboursIn(SEQUENCE, 12)).toEqual({ previous: null, next: 7 });
		expect(neighboursIn(SEQUENCE, 30)).toEqual({ previous: 7, next: null });
	});

	it('has no neighbours for an artwork the wall did not show', () => {
		expect(neighboursIn(SEQUENCE, 99)).toBeUndefined();
	});

	it('has no neighbours without a sequence or a record number', () => {
		expect(neighboursIn(undefined, 7)).toBeUndefined();
		expect(neighboursIn(SEQUENCE, null)).toBeUndefined();
	});
});
