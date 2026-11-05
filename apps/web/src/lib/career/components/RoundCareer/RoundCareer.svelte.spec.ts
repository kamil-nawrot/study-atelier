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

	it('names the new exhibits in the colour of their metal and a new rank, without plan points', async () => {
		round.mockResolvedValue({
			round: {
				tiers: [
					{ exhibit: 'collection', tier: 4, tiers: 9 },
					{ exhibit: 'eras', tier: 1, tiers: 5 }
				],
				points: 1846,
				rankSeen: 4
			}
		});
		render(RoundCareer, { props: { form: 'masculine', now: () => new Date(2026, 9, 29, 18) } });

		const collection = page.getByText(
			m.career.roundTierName(m.career.exhibits.collection.name, 'IV')
		);
		await expect.element(collection).toBeVisible();
		expect(collection.element().getAttribute('style')).toContain('--color-case-silver');
		await expect
			.element(
				page.getByRole('link', {
					name: m.career.roundTierName(m.career.exhibits.collection.name, 'IV')
				})
			)
			.toHaveAttribute('href', '/atelier/display-case');
		const eras = page.getByText(m.career.roundTierName(m.career.exhibits.eras.name, 'I'));
		expect(eras.element().getAttribute('style')).toContain('--color-case-bronze');
		await expect.element(page.getByText('Znawca')).toBeVisible();
		await expect.element(page.getByText(/pkt/)).not.toBeInTheDocument();
		expect(round).toHaveBeenCalledWith(new Date(2026, 9, 29));
	});

	it('says nothing when the career cannot be loaded', async () => {
		round.mockRejectedValue(new TypeError('Failed to fetch'));
		render(RoundCareer, { props: { form: 'masculine' } });

		await expect.element(page.getByText(m.career.roundTier)).not.toBeInTheDocument();
	});

	it('says nothing when no exhibit and no rank came with the round', async () => {
		round.mockResolvedValue({
			round: { tiers: [], points: 1846, rankSeen: 5 }
		});
		render(RoundCareer, { props: { form: 'feminine' } });

		await expect.element(page.getByText(m.career.roundRank)).not.toBeInTheDocument();
		expect(document.querySelectorAll('.career li')).toHaveLength(0);
	});
});
