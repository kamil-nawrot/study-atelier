import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import DisplayCasePage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/display-case'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/career/career-state/career-state.svelte.ts', () => ({
	career: {
		markSeen: vi.fn(),
		forLearner: vi.fn(),
		refresh: vi.fn().mockResolvedValue(undefined),
		standing: { points: 1846, newTiers: 0, rankSeen: 5 },
		hasNewTiers: false,
		hasNewRank: false,
		tierFlash: 0,
		rankFlash: 0
	}
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const exhibits: Exhibit[] = [
	{
		code: 'collection',
		value: 24,
		thresholds: [1, 10, 50],
		tiers: [{ exhibit: 'collection', tier: 1, unlockedAt: new Date(2026, 9, 1) }]
	},
	{ code: 'marathon', value: 0, thresholds: [1000], tiers: [] }
];

function renderDisplayCase(error?: string): void {
	render(DisplayCasePage, { data: { session: testSession(), exhibits, error }, params: {} });
}

describe('display case page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
	});

	it('explains the display case, shows the exhibits and marks what is new as seen', async () => {
		renderDisplayCase();

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent(m.career.title);
		await expect.element(page.getByText(m.career.lead)).toBeVisible();
		await expect.element(page.getByText(m.career.new)).toBeVisible();
		expect(career.markSeen).toHaveBeenCalledOnce();
		await expect.element(page.getByText(m.career.rankProgress(1846, 2000))).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.career.credits })).toBeVisible();
	});

	it('leaves the engraving of a hidden exhibit out of the credits', async () => {
		renderDisplayCase();

		await page.getByRole('button', { name: m.career.credits }).click();

		await expect.element(page.getByRole('link', { name: /Musei Wormiani/ })).toBeVisible();
		await expect.element(page.getByRole('link', { name: /Nemezis/ })).not.toBeInTheDocument();
	});

	it('says when the display case could not be loaded and marks nothing', async () => {
		renderDisplayCase(m.common.network);

		await expect.element(page.getByText(m.career.loadErrorTitle)).toBeVisible();
		expect(career.markSeen).not.toHaveBeenCalled();
	});
});
