import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { MODULE_FILES, SALON_SIZE, moduleArtworks, salonArtworks } from './salon.ts';

describe('salonArtworks', () => {
	it('hangs distinct public domain paintings on the wall', () => {
		const wall = salonArtworks();

		expect(wall).toHaveLength(SALON_SIZE);
		expect(new Set(wall.map((artwork) => artwork.file)).size).toBe(SALON_SIZE);
		for (const artwork of wall) {
			expect(artwork.publicDomain).toBe(true);
			expect(artwork.kind).toBe('painting');
		}
	});

	it('hangs another selection on another visit', () => {
		const first = salonArtworks(() => 0).map((artwork) => artwork.file);
		const second = salonArtworks(() => 0.999).map((artwork) => artwork.file);

		expect(first).not.toEqual(second);
	});
});

describe('moduleArtworks', () => {
	it('gives each module a public domain artwork that needs no credit', () => {
		const artworks = moduleArtworks();

		expect(artworks.map((artwork) => artwork.file)).toEqual([...MODULE_FILES]);
		expect(artworks).toHaveLength(m.landing.modules.length);
		for (const artwork of artworks) expect(artwork.credit).toBe(m.artwork.credit);
	});
});
