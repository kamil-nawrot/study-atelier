import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import BlanksSection from './BlanksSection.svelte';

describe('BlanksSection', () => {
	it('links each gap to the wall filter of the same name', async () => {
		render(BlanksSection, {
			artworks: [testArtwork(1, 'A', { eraCode: null, period: 'Gothic', typeCode: 'painting' })]
		});

		await expect
			.element(page.getByRole('heading', { name: m.statistics.blanks.title }))
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.atelier.filters.missing.era }))
			.toHaveAttribute('href', '/atelier?missing=era');
	});

	it('is left out when nothing is missing', async () => {
		render(BlanksSection, {
			artworks: [
				testArtwork(1, 'A', { eraCode: 'modern', period: 'Romanticism', typeCode: 'painting' })
			]
		});

		await expect
			.element(page.getByRole('heading', { name: m.statistics.blanks.title }))
			.not.toBeInTheDocument();
	});
});
