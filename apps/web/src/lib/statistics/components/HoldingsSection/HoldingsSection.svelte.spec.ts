import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testStatistics } from '#lib/testing/statistics/statistics.ts';
import HoldingsSection from './HoldingsSection.svelte';

describe('HoldingsSection', () => {
	it('names every number in the form that agrees with it', async () => {
		render(HoldingsSection, {
			holdings: { artworks: 1, authors: 3, places: 12, seen: 0 },
			statistics: testStatistics({ terms: 22, events: 5, visits: 1, trips: 3 })
		});

		const texts = m.statistics.holdings;
		const section = page.getByRole('region', { name: texts.title });
		await expect.element(section.getByText(texts.artworks(1), { exact: true })).toBeVisible();
		await expect.element(section.getByText(texts.authors(3))).toBeVisible();
		await expect.element(section.getByText(texts.places(12))).toBeVisible();
		await expect.element(section.getByText(texts.seen(0))).toBeVisible();
		await expect.element(section.getByText(texts.terms(22))).toBeVisible();
		await expect.element(section.getByText(texts.events(5))).toBeVisible();
		await expect.element(section.getByText(texts.visits(1))).toBeVisible();
		await expect.element(section.getByText(texts.trips(3))).toBeVisible();
		await expect.element(section.getByText('22', { exact: true })).toBeVisible();
	});
});
