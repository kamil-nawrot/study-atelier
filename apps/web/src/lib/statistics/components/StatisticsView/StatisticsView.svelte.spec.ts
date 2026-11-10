import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testStatistics } from '#lib/testing/statistics/statistics.ts';
import StatisticsView from './StatisticsView.svelte';

describe('StatisticsView', () => {
	it('shows the lead and the holdings counted from the artworks, leaving the title to the top bar', async () => {
		render(StatisticsView, {
			artworks: [
				testArtwork(1, 'Mona Lisa', { authors: ['Leonardo'], location: 'Louvre' }),
				testArtwork(2, 'Annunciation', { authors: ['Leonardo'], location: 'Uffizi' })
			],
			statistics: testStatistics()
		});

		await expect.element(page.getByText(m.statistics.lead)).toBeVisible();
		await expect.element(page.getByRole('heading', { level: 1 })).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { level: 2, name: m.statistics.holdings.title }))
			.toBeVisible();
		await expect
			.element(page.getByText(m.statistics.holdings.authors(1), { exact: true }))
			.toBeVisible();
	});

	it('shows the empty state with a way to add the first artwork', async () => {
		render(StatisticsView, { artworks: [], statistics: testStatistics() });

		await expect.element(page.getByText(m.statistics.emptyTitle)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.statistics.addArtwork }))
			.toHaveAttribute('href', '/atelier/new');
		await expect
			.element(page.getByRole('heading', { level: 2, name: m.statistics.holdings.title }))
			.not.toBeInTheDocument();
	});
});
