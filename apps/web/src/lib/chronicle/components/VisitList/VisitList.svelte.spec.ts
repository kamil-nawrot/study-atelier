import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
import VisitList from './VisitList.svelte';

const lilies = testArtwork(1, 'Water Lilies');

describe('VisitList', () => {
	it('invites to log the first visit when there is none', async () => {
		render(VisitList, { visits: [], artworks: new Map() });

		await expect.element(page.getByText(m.chronicle.empty)).toBeInTheDocument();
	});

	it('groups visits under their years, newest first, and counts only artworks in the collection', async () => {
		render(VisitList, {
			visits: [
				testVisit({ id: 'old', place: 'Uffizi', date: { on: '2019-01-01', precision: 'year' } }),
				testVisit({ id: 'new', artworkIds: [lilies.id, 'trashed'] })
			],
			artworks: new Map([[lilies.id, lilies]])
		});

		const years = page.getByRole('heading', { level: 2 }).elements();
		expect(years.map((heading) => heading.textContent?.trim().slice(0, 4))).toEqual([
			'2026',
			'2019'
		]);
		await expect.element(page.getByText(m.chronicle.seen(1))).toBeInTheDocument();
		const backdrop = document.querySelector('[aria-hidden="true"] img');
		expect(backdrop?.getAttribute('src')).toBe(lilies.image?.src);
	});

	it('opens only the newest year and lets the learner open the others', async () => {
		render(VisitList, {
			visits: [
				testVisit({ id: 'old', place: 'Uffizi', date: { on: '2019-01-01', precision: 'year' } }),
				testVisit({ id: 'new', date: { on: '2018-05-03', precision: 'day' }, place: 'Prado' })
			],
			artworks: new Map()
		});

		await expect.element(page.getByRole('link', { name: 'Uffizi' })).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Prado' })).not.toBeInTheDocument();
		await page.getByRole('heading', { name: /^2018/ }).click();
		await expect.element(page.getByRole('link', { name: 'Prado' })).toBeVisible();
	});
});
