import { describe, expect, it } from 'vitest';
import { extractPalette, hexOf, storedPalette } from './palette.ts';

function pixels(...parts: [number[], number][]): Uint8ClampedArray {
	const data: number[] = [];
	for (const [colour, count] of parts) {
		for (let index = 0; index < count; index += 1) data.push(...colour, 255);
	}
	return Uint8ClampedArray.from(data);
}

describe('extractPalette', () => {
	it('returns the colours of the image with their shares, the widest first', () => {
		const palette = extractPalette(pixels([[200, 20, 20], 30], [[20, 20, 200], 70]));

		expect(palette).toEqual([
			{ color: '#1414c8', share: 0.7 },
			{ color: '#c81414', share: 0.3 }
		]);
	});

	it('gives the same palette every time', () => {
		const data = pixels([[10, 200, 30], 11], [[250, 240, 10], 7], [[90, 90, 90], 40]);

		expect(extractPalette(data)).toEqual(extractPalette(data));
	});

	it('returns at most six colours whose shares add up to one', () => {
		const parts: [number[], number][] = Array.from({ length: 10 }, (_, index) => [
			[index * 25, 255 - index * 25, (index * 60) % 256],
			10 + index
		]);

		const palette = extractPalette(pixels(...parts));

		expect(palette.length).toBeLessThanOrEqual(6);
		const total = palette.reduce((sum, colour) => sum + colour.share, 0);
		expect(total).toBeCloseTo(1, 1);
	});

	it('returns one colour for a flat image', () => {
		expect(extractPalette(pixels([[10, 20, 30], 25]))).toEqual([{ color: '#0a141e', share: 1 }]);
	});

	it('keeps a colour of a few stray pixels in a palette the database accepts', () => {
		const palette = extractPalette(pixels([[180, 160, 120], 4094], [[10, 10, 240], 2]));

		expect(palette).toEqual([
			{ color: '#b4a078', share: 1 },
			{ color: '#0a0af0', share: 0.001 }
		]);
		expect(storedPalette(palette)).toEqual(palette);
	});

	it('ignores transparent pixels', () => {
		const data = Uint8ClampedArray.from([255, 0, 0, 0, 0, 0, 255, 255]);

		expect(extractPalette(data)).toEqual([{ color: '#0000ff', share: 1 }]);
	});

	it('returns nothing for an image without visible pixels', () => {
		expect(extractPalette(Uint8ClampedArray.from([1, 2, 3, 0]))).toEqual([]);
		expect(extractPalette(new Uint8ClampedArray())).toEqual([]);
	});
});

describe('hexOf', () => {
	it('writes channels as two lower case digits', () => {
		expect(hexOf([0, 10.4, 255])).toBe('#000aff');
	});
});

describe('storedPalette', () => {
	it('accepts a list of colours with shares', () => {
		const value = [
			{ color: '#aa8855', share: 0.6 },
			{ color: '#223344', share: 0.4 }
		];

		expect(storedPalette(value)).toEqual(value);
	});

	it.each([
		['null', null],
		['an empty list', []],
		['seven colours', Array.from({ length: 7 }, () => ({ color: '#000000', share: 0.1 }))],
		['a number', [1]],
		['a null entry', [null]],
		['a bad colour', [{ color: 'red', share: 0.5 }]],
		['a bad share', [{ color: '#000000', share: 2 }]],
		['a missing share', [{ color: '#000000' }]]
	])('rejects %s', (_name, value) => {
		expect(storedPalette(value)).toBeUndefined();
	});
});
