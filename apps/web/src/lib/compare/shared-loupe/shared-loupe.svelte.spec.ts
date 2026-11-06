import { describe, expect, it } from 'vitest';
import { SharedLoupe } from './shared-loupe.svelte.ts';

describe('SharedLoupe', () => {
	it('switches on only when an image is large enough', () => {
		const loupe = new SharedLoupe();

		loupe.toggle(false);
		expect(loupe.on).toBe(false);

		loupe.toggle(true);
		expect(loupe.on).toBe(true);
	});

	it('forgets the spot when it is switched off', () => {
		const loupe = new SharedLoupe();
		loupe.toggle(true);
		loupe.spot = { x: 0.5, y: 0.5 };

		loupe.toggle(true);

		expect(loupe.on).toBe(false);
		expect(loupe.spot).toBeUndefined();
	});

	it('closes', () => {
		const loupe = new SharedLoupe();
		loupe.toggle(true);
		loupe.spot = { x: 0.1, y: 0.2 };

		loupe.close();

		expect(loupe.on).toBe(false);
		expect(loupe.spot).toBeUndefined();
	});
});
