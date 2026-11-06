import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { m } from '#lib/i18n/i18n.ts';
import { applyEraBounds } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import EraOutsideNote from './EraOutsideNote.svelte';

const renaissance = { kind: 'era' as const, code: 'early_modern' as const };

function dated(id: number, year: number): ReturnType<typeof testArtwork> {
	return {
		...testArtwork(id, `Artwork ${id}`),
		eraCode: 'early_modern',
		yearFrom: year,
		yearTo: year
	};
}

describe('EraOutsideNote', () => {
	afterEach(() => applyEraBounds(null));

	it('counts the artworks dated outside the era and links to them on the wall', async () => {
		applyEraBounds([-3000, 476, 1560, 1789, 1945]);

		render(EraOutsideNote, {
			subject: renaissance,
			artworks: [dated(1, 1500), dated(2, 1600)]
		});

		await expect.element(page.getByText(m.eraBounds.outside(1))).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.eraBounds.showOutside }))
			.toHaveAttribute('href', '/atelier?era=early_modern&missing=outsideEra');
	});

	it('says nothing when every artwork fits the era', async () => {
		render(EraOutsideNote, { subject: renaissance, artworks: [dated(1, 1600)] });

		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});
});
