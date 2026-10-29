import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { curiosityOf } from './curiosities.ts';

describe('curiosities', () => {
	it('gives the curiosity of a tier with its source', () => {
		expect(curiosityOf('grand_tour', 1)).toEqual({
			text: m.career.curiosities.grand_tour[0],
			source: 'https://www.benesse-artsite.jp/en/art/chichu.html'
		});
	});

	it('has none for a tier or an exhibit without one', () => {
		expect(curiosityOf('grand_tour', 6)).toBeUndefined();
		expect(curiosityOf('marathon', 1)).toBeUndefined();
	});

	it('has a source for every curiosity', () => {
		for (const [exhibit, texts] of Object.entries(m.career.curiosities)) {
			texts.forEach((_, index) => expect(curiosityOf(exhibit, index + 1)).toBeDefined());
		}
	});
});
