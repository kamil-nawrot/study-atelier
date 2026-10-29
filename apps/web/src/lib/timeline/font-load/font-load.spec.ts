import { describe, expect, it } from 'vitest';
import { countFontLoads, fontLoads } from './font-load.svelte.ts';

describe('font load', () => {
	it('counts the moment the web fonts are ready', async () => {
		let ready: () => void = () => {};
		const before = fontLoads();
		countFontLoads({
			ready: new Promise<void>((done) => (ready = done))
		} as unknown as FontFaceSet);
		expect(fontLoads()).toBe(before);

		ready();
		await Promise.resolve();
		await Promise.resolve();

		expect(fontLoads()).toBe(before + 1);
	});

	it('does nothing without a font set', () => {
		const before = fontLoads();
		countFontLoads(undefined);
		expect(fontLoads()).toBe(before);
	});
});
