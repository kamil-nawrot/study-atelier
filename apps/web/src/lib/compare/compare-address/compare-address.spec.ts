import { describe, expect, it } from 'vitest';
import { compareHref, sidesOf, swapped } from './compare-address.ts';

describe('sidesOf', () => {
	it('reads both record numbers', () => {
		expect(sidesOf(new URLSearchParams('left=42&right=7'))).toEqual({ left: 42, right: 7 });
	});

	it('leaves a missing or invalid number empty', () => {
		expect(sidesOf(new URLSearchParams('right=7'))).toEqual({ left: null, right: 7 });
		expect(sidesOf(new URLSearchParams('left=abc&right=0'))).toEqual({ left: null, right: null });
		expect(sidesOf(new URLSearchParams(''))).toEqual({ left: null, right: null });
	});
});

describe('compareHref', () => {
	it('writes the numbers that are set', () => {
		expect(compareHref({ left: 42, right: 7 })).toBe('/atelier/compare?left=42&right=7');
		expect(compareHref({ left: null, right: 7 })).toBe('/atelier/compare?right=7');
	});

	it('writes no query for an empty comparison', () => {
		expect(compareHref({ left: null, right: null })).toBe('/atelier/compare');
	});
});

describe('swapped', () => {
	it('exchanges the halves', () => {
		expect(swapped({ left: 42, right: null })).toEqual({ left: null, right: 42 });
	});
});
