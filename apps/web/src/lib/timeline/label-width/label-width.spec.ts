import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import {
	labelCut,
	labelWidth,
	measureAgainWhenFontsLoad,
	NAME_MAX_WIDTH
} from './label-width.svelte.ts';

function canvas(charWidth: number): void {
	vi.stubGlobal('document', {
		createElement: () => ({
			getContext: () => ({
				font: '',
				measureText: (text: string) => ({ width: text.length * charWidth })
			})
		}),
		body: {}
	});
	vi.stubGlobal('getComputedStyle', () => ({ fontFamily: 'Schibsted Grotesk' }));
}

describe('label width', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('caps a long name and says that it is cut', () => {
		canvas(10);
		expect(labelWidth('Bitwa')).toBe(64);
		expect(labelWidth('x'.repeat(40))).toBe(NAME_MAX_WIDTH + 14);
		expect(labelCut('x'.repeat(40))).toBe(true);
	});

	it('measures the names again once the web font has loaded', async () => {
		canvas(10);
		let loaded: () => void = () => {};
		measureAgainWhenFontsLoad({
			ready: new Promise<void>((done) => (loaded = done))
		} as unknown as FontFaceSet);
		expect(labelWidth('Unia')).toBe(54);

		canvas(20);
		expect(labelWidth('Unia')).toBe(54);
		loaded();
		await Promise.resolve();
		await Promise.resolve();
		flushSync();
		expect(labelWidth('Unia')).toBe(94);
	});
});
