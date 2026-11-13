import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';
import ExhibitionList from './ExhibitionList.svelte';

function summary(id: string, title: string, artworkCount = 1): ExhibitionSummary {
	return { id, title, updatedAt: '2020-03-04T10:00:00Z', artworkCount, coverId: null };
}

describe('ExhibitionList', () => {
	afterEach(() => localStorage.clear());

	it('lists the exhibitions in the order given, each with its cover', async () => {
		const cover = testArtwork(1, 'Judith');
		render(ExhibitionList, {
			exhibitions: [{ ...summary('b', 'Light'), coverId: cover.id }, summary('a', 'Shadow')],
			covers: new Map([[cover.id, cover]])
		});

		const titles = page.getByRole('listitem').elements();
		expect(titles.map((item) => item.textContent?.includes('Light'))).toEqual([true, false]);
		expect(document.querySelectorAll('img')).toHaveLength(1);
		await expect.element(page.getByRole('link', { name: /Shadow/ })).toBeInTheDocument();
	});

	it('offers the search and the order however few exhibitions there are', async () => {
		render(ExhibitionList, { exhibitions: [summary('a', 'Show a')], covers: new Map() });

		await expect.element(page.getByRole('searchbox', { name: m.exhibitions.search })).toBeVisible();
		await expect
			.element(page.getByRole('combobox', { name: m.exhibitions.sortLabel }))
			.toHaveValue('changed');
	});

	it('orders the exhibitions by the most artworks and keeps the choice', async () => {
		render(ExhibitionList, {
			exhibitions: [summary('a', 'Few', 1), summary('b', 'Many', 4)],
			covers: new Map()
		});

		await page
			.getByRole('combobox', { name: m.exhibitions.sortLabel })
			.selectOptions(m.exhibitions.sorts.count);

		const items = page.getByRole('listitem').elements();
		expect(items.map((item) => item.textContent?.includes('Many'))).toEqual([true, false]);
		expect(localStorage.getItem('study-atelier:exhibition-sort')).toBe('count');
	});

	it('filters the exhibitions by a fragment of the title', async () => {
		render(ExhibitionList, {
			exhibitions: [
				summary('a', 'Światło u Caravaggia'),
				...['b', 'c', 'd', 'e'].map((id) => summary(id, `Martwa natura ${id}`))
			],
			covers: new Map()
		});

		await page.getByRole('searchbox', { name: m.exhibitions.search }).fill('swiatlo');

		expect(page.getByRole('listitem').elements()).toHaveLength(1);
		await expect.element(page.getByRole('link', { name: /Caravaggia/ })).toBeInTheDocument();
	});

	it('says so when no title matches', async () => {
		render(ExhibitionList, {
			exhibitions: ['a', 'b', 'c', 'd', 'e'].map((id) => summary(id, `Show ${id}`)),
			covers: new Map(),
			query: 'pejzaż'
		});

		await expect.element(page.getByText(m.exhibitions.noResults('pejzaż'))).toBeInTheDocument();
		expect(page.getByRole('listitem').elements()).toHaveLength(0);
	});
});
