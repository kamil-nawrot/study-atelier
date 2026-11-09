import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import StatisticsPage from './+page.svelte';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/statistics'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const statistics: CollectionStatistics = {
	terms: 5,
	events: 1,
	visits: 2,
	exhibitions: 3,
	quizAnswers: 0,
	correctAnswers: 0,
	mostReviewed: [],
	growth: null,
	authorsWithYears: 0,
	longestLived: null,
	mostPinned: null,
	largestVisit: null
};

function renderStatistics(artworks: WallArtwork[], error?: string): void {
	render(StatisticsPage, {
		data: {
			session: testSession(),
			artworks,
			cards: new Map(),
			statistics: error ? undefined : statistics,
			error
		},
		params: {}
	});
}

describe('statistics page', () => {
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	it('shows the holdings of the atelier and leads back to the wall', async () => {
		renderStatistics([
			testArtwork(1, 'Mona Lisa', { authors: ['Leonardo'], location: 'Louvre', seen: true }),
			testArtwork(2, 'Annunciation', { authors: ['Leonardo'], location: 'Uffizi' })
		]);

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.statistics.title);
		await expect.element(page.getByText(m.statistics.lead)).toBeVisible();
		const holdings = page.getByRole('region', { name: m.statistics.holdings.title });
		await expect.element(holdings.getByText(m.statistics.holdings.artworks(2))).toBeVisible();
		await expect.element(holdings.getByText(m.statistics.holdings.authors(1))).toBeVisible();
		await expect.element(holdings.getByText(m.statistics.holdings.places(2))).toBeVisible();
		await expect.element(holdings.getByText(m.statistics.holdings.seen(1))).toBeVisible();
		await expect.element(holdings.getByText(m.statistics.holdings.terms(5))).toBeVisible();
		await expect.element(holdings.getByText(m.statistics.holdings.events(1))).toBeVisible();
		await expect.element(holdings.getByText(m.statistics.holdings.visits(2))).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.statistics.back }).first())
			.toHaveAttribute('href', '/atelier');
	});

	it('invites to add the first artwork in an empty atelier', async () => {
		renderStatistics([]);

		await expect.element(page.getByText(m.statistics.emptyTitle)).toBeVisible();
		await expect.element(page.getByText(m.statistics.empty)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.statistics.addArtwork }))
			.toHaveAttribute('href', '/atelier/new');
		await expect.element(page.getByText(m.statistics.lead)).not.toBeInTheDocument();
	});

	it('says when the statistics could not be loaded', async () => {
		renderStatistics([], m.statistics.loadError);

		await expect.element(page.getByText(m.statistics.loadError)).toBeVisible();
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.statistics.title);
	});
});
