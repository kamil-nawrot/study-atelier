import { describe, expect, it } from 'vitest';
import { countFontLoads, fontLoads } from './font-load.svelte.ts';

describe('font load', () => {
	it('counts the moment the web fonts are ready', async () => {
		let ready: () => void = () => {};
		const before = fontLoads();
		countFontLoads({
			ready: new Promise<void>((done) => (ready = done)),
			addEventListener: () => {}
		} as unknown as FontFaceSet);
		expect(fontLoads()).toBe(before);

		ready();
		await Promise.resolve();
		await Promise.resolve();

		expect(fontLoads()).toBe(before + 1);
	});

	it('counts every later load of a font face', () => {
		const fonts = new EventTarget();
		const before = fontLoads();
		countFontLoads(
			Object.assign(fonts, { ready: new Promise<void>(() => {}) }) as unknown as FontFaceSet
		);

		fonts.dispatchEvent(new Event('loadingdone'));
		fonts.dispatchEvent(new Event('loadingdone'));

		expect(fontLoads()).toBe(before + 2);
	});

	it('does nothing without a font set', () => {
		const before = fontLoads();
		countFontLoads(undefined);
		expect(fontLoads()).toBe(before);
	});
});
