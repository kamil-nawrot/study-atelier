import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { loadRoundCareer } from '#lib/career/standing-data/standing-data.ts';
import RoundCareer from './RoundCareer.svelte';

vi.mock('#lib/career/standing-data/standing-data.ts', () => ({
	loadRoundCareer: vi.fn(),
	loadStanding: vi.fn().mockResolvedValue({}),
	markRankSeen: vi.fn()
}));

const round = vi.mocked(loadRoundCareer);

describe('RoundCareer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('sums up the day for the career: plan points, lit tiers and a new rank', async () => {
		round.mockResolvedValue({
			round: {
				plan: { share: 1, streak: 12 },
				tiers: [{ exhibit: 'collection', tier: 4 }],
				points: 1846,
				rankSeen: 4
			}
		});
		render(RoundCareer, { props: { form: 'masculine', now: () => new Date(2026, 9, 29, 18) } });

		await expect.element(page.getByText(m.career.roundPlan(15, 12, 50))).toBeVisible();
		await expect
			.element(page.getByText(m.career.roundTier('IV', m.career.exhibits.collection.name)))
			.toBeVisible();
		await expect.element(page.getByText(m.career.roundRank('Znawca'))).toBeVisible();
		expect(round).toHaveBeenCalledWith(new Date(2026, 9, 29));
	});

	it('says nothing when the career cannot be loaded', async () => {
		round.mockRejectedValue(new TypeError('Failed to fetch'));
		render(RoundCareer, { props: { form: 'masculine' } });

		await expect.element(page.getByText(/Za dzisiejszy plan/)).not.toBeInTheDocument();
	});

	it('says nothing more than the plan when nothing else happened', async () => {
		round.mockResolvedValue({
			round: { plan: { share: 0.5, streak: 1 }, tiers: [], points: 1846, rankSeen: 5 }
		});
		render(RoundCareer, { props: { form: 'feminine' } });

		await expect.element(page.getByText(m.career.roundPlan(5, 1, 0))).toBeVisible();
		await expect.element(page.getByText(/Nowy stopień/)).not.toBeInTheDocument();
	});
});
