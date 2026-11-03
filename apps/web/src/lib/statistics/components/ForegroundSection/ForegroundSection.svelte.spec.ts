import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { dimensionsOf } from '#lib/statistics/dimensions/dimensions.ts';
import ForegroundSection from './ForegroundSection.svelte';

const texts = m.statistics.foreground;

const artworks = [
	'Leonardo',
	'Leonardo',
	'Leonardo',
	'Rembrandt',
	'Rembrandt',
	'Vermeer',
	'Vermeer',
	'Titian'
].map((author, index) =>
	testArtwork(index + 1, `Work ${index}`, { authors: [author], styles: ['Baroque'] })
);

describe('ForegroundSection', () => {
	it('ranks the authors and links each to the wall', async () => {
		render(ForegroundSection, { artworks, dimensions: dimensionsOf() });

		await expect
			.element(page.getByRole('link', { name: '1. Leonardo' }))
			.toHaveAttribute('href', '/atelier?author=Leonardo');
		await expect.element(page.getByText(texts.single(1, 4, texts.kinds.authors))).toBeVisible();
	});

	it('says when a ranking will appear', async () => {
		render(ForegroundSection, { artworks, dimensions: dimensionsOf() });

		await page.getByRole('tab', { name: texts.tabs.styles }).click();

		await expect.element(page.getByText(texts.tooEarly.styles)).toBeVisible();
	});
});
