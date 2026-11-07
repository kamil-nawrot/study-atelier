import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { limitOf } from '#lib/exhibitions/editor/block-limits/block-limits.ts';
import { artwork, doc, textBlock } from '#lib/testing/exhibitions/exhibitions.ts';

describe('limitOf', () => {
	it('says which limit an exhibition goes over', () => {
		expect(limitOf(doc(textBlock('Alpha')))).toBeUndefined();
		expect(limitOf(doc(...Array.from({ length: 301 }, () => textBlock('x'))))).toBe(
			m.exhibitions.limits.blocks
		);
		expect(limitOf(doc(...Array.from({ length: 101 }, (_, index) => artwork(`a${index}`))))).toBe(
			m.exhibitions.limits.artworks
		);
		expect(limitOf(doc(textBlock('x'.repeat(600000))))).toBe(m.exhibitions.errors.tooBig);
	});
});
