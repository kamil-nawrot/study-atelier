import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import ArtworkRow from './ArtworkRow.svelte';

describe('ArtworkRow', () => {
	it('links the artwork with its authors and an optional detail', async () => {
		render(ArtworkRow, {
			artwork: testArtwork(4, 'Ofelia', { authors: ['Millais'] }),
			detail: '11 razy'
		});

		await expect
			.element(page.getByRole('link', { name: /Ofelia/ }))
			.toHaveAttribute('href', '/atelier/4');
		await expect.element(page.getByText('Millais')).toBeVisible();
		await expect.element(page.getByText('11 razy')).toBeVisible();
	});
});
