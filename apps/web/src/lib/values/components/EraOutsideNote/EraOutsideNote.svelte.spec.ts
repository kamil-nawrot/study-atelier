import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { m } from '#lib/i18n/i18n.ts';
import { applyEraBounds } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import EraOutsideNote from './EraOutsideNote.svelte';

function dated(id: number, year: number): WallArtwork {
	return {
		...testArtwork(id, `Artwork ${id}`),
		eraCode: 'early_modern',
		yearFrom: year,
		yearTo: year
	};
}

describe('EraOutsideNote', () => {
	afterEach(() => applyEraBounds(null));

	it('warns about the artworks dated outside the era and leads to them on the wall', async () => {
		applyEraBounds([-3000, 476, 1560, 1789, 1945]);

		render(EraOutsideNote, { code: 'early_modern', artworks: [dated(1, 1500), dated(2, 1600)] });

		const link = page.getByRole('link', { name: m.eraBounds.outside(1) });
		await expect
			.element(link)
			.toHaveAttribute('href', '/atelier?era=early_modern&missing=outsideEra');
		await link.hover();
		await expect.element(page.getByRole('tooltip')).toHaveTextContent(m.eraBounds.outside(1));
		await expect.element(link).not.toHaveAccessibleDescription();
	});

	it('shows nothing when every artwork fits the era', async () => {
		render(EraOutsideNote, { code: 'early_modern', artworks: [dated(1, 1600)] });

		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});
});
