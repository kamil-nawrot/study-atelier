import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { dimensionsOf, type Dimension } from '#lib/statistics/dimensions/dimensions.ts';
import { crossTableOf } from '#lib/statistics/distribution/distribution.ts';
import CrossTable from './CrossTable.svelte';

const dimensions = dimensionsOf();
const types = dimensions.find((dimension) => dimension.key === 'types') as Dimension;
const eras = dimensions.find((dimension) => dimension.key === 'eras') as Dimension;

describe('CrossTable', () => {
	it('shows the counts with their totals and links every count to the wall', async () => {
		const artworks = [
			testArtwork(1, 'Kouros', { typeCode: 'sculpture', eraCode: 'antiquity' }),
			testArtwork(2, 'Venus', { typeCode: 'sculpture', eraCode: 'antiquity' }),
			testArtwork(3, 'Mona Lisa', { typeCode: 'painting', eraCode: 'early_modern' })
		];

		render(CrossTable, { table: crossTableOf(artworks, types, eras), rows: types, columns: eras });

		await expect
			.element(page.getByRole('columnheader', { name: m.eras.antiquity.name }))
			.toBeVisible();
		await expect
			.element(page.getByRole('rowheader', { name: m.artworkTypes.sculpture }))
			.toBeVisible();
		await expect
			.element(
				page.getByRole('link', {
					name: `${m.artworkTypes.sculpture}, ${m.eras.antiquity.name}: 2`
				})
			)
			.toHaveAttribute('href', '/atelier?era=antiquity&type=sculpture');
		await expect
			.element(page.getByRole('cell', { name: m.statistics.composition.zero }).first())
			.toBeVisible();
		await expect.element(page.getByRole('cell', { name: '3', exact: true })).toBeVisible();
	});
});
