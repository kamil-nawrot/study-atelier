import { afterEach, describe, expect, it, vi } from 'vitest';
import { fontLoads } from '#lib/timeline/font-load/font-load.svelte.ts';
import { labelCut, labelWidth, NAME_MAX_WIDTH } from './label-width.ts';

vi.mock('#lib/timeline/font-load/font-load.svelte.ts', () => ({ fontLoads: vi.fn(() => 0) }));

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

	it('measures the names again once the web font has loaded', () => {
		canvas(10);
		expect(labelWidth('Unia')).toBe(54);

		canvas(20);
		expect(labelWidth('Unia')).toBe(54);
		vi.mocked(fontLoads).mockReturnValue(1);
		expect(labelWidth('Unia')).toBe(94);
	});
});
