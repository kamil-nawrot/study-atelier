import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadStanding, markRankSeen } from '#lib/career/standing-data/standing-data.ts';
import { markTiersSeen } from '#lib/career/career-data/career-data.ts';
import { CareerState } from './career-state.svelte.ts';

vi.mock('#lib/career/standing-data/standing-data.ts', () => ({
	loadStanding: vi.fn(),
	markRankSeen: vi.fn()
}));
vi.mock('#lib/career/career-data/career-data.ts', () => ({ markTiersSeen: vi.fn() }));

const standing = vi.mocked(loadStanding);

describe('career state', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('knows the rank and whether something is new, without a flash on the first load', async () => {
		standing.mockResolvedValue({ standing: { points: 1846, newTiers: 2, rankSeen: 4 } });
		const career = new CareerState();
		await career.refresh();

		expect(career.rank).toBe(5);
		expect(career.hasNewTiers).toBe(true);
		expect(career.hasNewRank).toBe(true);
		expect([career.tierFlash, career.rankFlash]).toEqual([0, 0]);
	});

	it('flashes when a tier or a rank arrives while the learner works', async () => {
		const career = new CareerState();
		standing.mockResolvedValue({ standing: { points: 1990, newTiers: 0, rankSeen: 5 } });
		await career.refresh();
		standing.mockResolvedValue({ standing: { points: 2004, newTiers: 1, rankSeen: 5 } });
		await career.refresh();

		expect([career.tierFlash, career.rankFlash]).toEqual([1, 1]);
	});

	it('keeps what it knew when the standing cannot be loaded', async () => {
		const career = new CareerState();
		standing.mockResolvedValue({ standing: { points: 60, newTiers: 0, rankSeen: 2 } });
		await career.refresh();
		standing.mockResolvedValue({ error: 'Brak połączenia' });
		await career.refresh();

		expect(career.standing).toEqual({ points: 60, newTiers: 0, rankSeen: 2 });
	});

	it('marks the new tiers and the new rank as seen', async () => {
		const career = new CareerState();
		standing.mockResolvedValue({ standing: { points: 1846, newTiers: 2, rankSeen: 4 } });
		await career.refresh();
		await career.markSeen();

		expect(markTiersSeen).toHaveBeenCalledOnce();
		expect(markRankSeen).toHaveBeenCalledWith(5);
		expect([career.hasNewTiers, career.hasNewRank]).toEqual([false, false]);
	});

	it('does not count the first rank as a promotion', async () => {
		const career = new CareerState();
		standing.mockResolvedValue({ standing: { points: 0, newTiers: 0, rankSeen: 0 } });
		await career.refresh();

		expect(career.hasNewRank).toBe(false);
	});

	it('ignores a standing loaded before the tiers were marked as seen', async () => {
		const career = new CareerState();
		standing.mockResolvedValue({ standing: { points: 60, newTiers: 1, rankSeen: 2 } });
		await career.refresh();
		let answer: (value: Awaited<ReturnType<typeof loadStanding>>) => void = () => {};
		standing.mockReturnValue(new Promise((resolve) => (answer = resolve)));
		const late = career.refresh();
		await career.markSeen();
		answer({ standing: { points: 60, newTiers: 1, rankSeen: 2 } });
		await late;

		expect(career.hasNewTiers).toBe(false);
		expect(career.tierFlash).toBe(0);
	});

	it('forgets the standing of another learner', async () => {
		const career = new CareerState();
		career.forLearner('learner-a');
		standing.mockResolvedValue({ standing: { points: 1846, newTiers: 2, rankSeen: 5 } });
		await career.refresh();
		career.forLearner('learner-b');

		expect(career.standing).toBeUndefined();
		standing.mockResolvedValue({ standing: { points: 4000, newTiers: 3, rankSeen: 7 } });
		await career.refresh();
		expect([career.tierFlash, career.rankFlash]).toEqual([0, 0]);
	});
});
