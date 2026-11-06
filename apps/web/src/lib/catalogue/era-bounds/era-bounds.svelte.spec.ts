import { afterEach, describe, expect, it } from 'vitest';
import {
	DEFAULT_ERA_JUNCTIONS,
	applyEraBounds,
	defaultJunctions,
	eraJunctions,
	validJunctions
} from './era-bounds.svelte.ts';

describe('era bounds', () => {
	afterEach(() => applyEraBounds(null));

	it('starts at the default junctions', () => {
		expect(eraJunctions()).toEqual(DEFAULT_ERA_JUNCTIONS);
	});

	it('applies the learner junctions and falls back to the defaults for invalid ones', () => {
		applyEraBounds([-3000, 476, 1560, 1789, 1945]);
		expect(eraJunctions()).toEqual([-3000, 476, 1560, 1789, 1945]);

		applyEraBounds([-3000, 1500, 476, 1789, 1945]);
		expect(eraJunctions()).toEqual(DEFAULT_ERA_JUNCTIONS);
	});

	it('accepts five ascending whole years after the start of prehistory', () => {
		expect(validJunctions([-3000, 476, 1492, 1789, 1945])).toBe(true);
		expect(validJunctions([-3000, 476, 1492, 1789])).toBe(false);
		expect(validJunctions([-50000, 476, 1492, 1789, 1945])).toBe(false);
		expect(validJunctions([-3000, 476.5, 1492, 1789, 1945])).toBe(false);
		expect(validJunctions(null)).toBe(false);
	});

	it('tells the default junctions apart', () => {
		expect(defaultJunctions(DEFAULT_ERA_JUNCTIONS)).toBe(true);
		expect(defaultJunctions([-3000, 476, 1560, 1789, 1945])).toBe(false);
	});
});
