import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { dimensionsOf } from '#lib/statistics/dimensions/dimensions.ts';
import CompositionSection from './CompositionSection.svelte';

const texts = m.statistics.composition;

function artworks(count: number): ReturnType<typeof testArtwork>[] {
	return Array.from({ length: count }, (_, index) =>
		testArtwork(index + 1, `Work ${index}`, {
			eraCode: index % 2 === 0 ? 'antiquity' : 'modern',
			typeCode: index % 3 === 0 ? 'sculpture' : 'painting'
		})
	);
}

describe('CompositionSection', () => {
	it('starts with the eras as bars and turns into a table with a second dimension', async () => {
		render(CompositionSection, { artworks: artworks(20), dimensions: dimensionsOf() });

		await expect
			.element(page.getByRole('link', { name: m.eras.antiquity.name }))
			.toHaveAttribute('href', '/atelier?era=antiquity');
		await expect
			.element(
				page
					.getByRole('group', { name: texts.secondBy })
					.getByRole('button', { name: texts.noSecond })
			)
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(
				page.getByRole('group', { name: texts.secondBy }).getByRole('button', { name: 'Epoka' })
			)
			.not.toBeInTheDocument();

		await page
			.getByRole('group', { name: texts.secondBy })
			.getByRole('button', { name: 'Typ' })
			.click();

		await expect.element(page.getByRole('table')).toBeVisible();
		await expect
			.element(page.getByRole('columnheader', { name: m.artworkTypes.painting }))
			.toBeVisible();
	});

	it('drops the second dimension when it becomes the first', async () => {
		render(CompositionSection, { artworks: artworks(20), dimensions: dimensionsOf() });

		await page
			.getByRole('group', { name: texts.secondBy })
			.getByRole('button', { name: 'Typ' })
			.click();
		await page
			.getByRole('group', { name: texts.groupBy })
			.getByRole('button', { name: 'Typ' })
			.click();

		await expect.element(page.getByRole('table')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.artworkTypes.sculpture }))
			.toHaveAttribute('href', '/atelier?type=sculpture');
	});

	it('says when the distribution will appear', async () => {
		render(CompositionSection, { artworks: artworks(8), dimensions: dimensionsOf() });

		await expect.element(page.getByText(texts.tooEarly(8))).toBeVisible();
		await expect.element(page.getByRole('group', { name: texts.groupBy })).not.toBeInTheDocument();
	});
});
