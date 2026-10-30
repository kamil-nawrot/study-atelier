import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadPoints, unlockExhibits } from '#lib/career/career-data/career-data.ts';
import { loadRoundCareer, loadStanding, markRankSeen } from './standing-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));
vi.mock('#lib/career/career-data/career-data.ts', () => ({
	loadPoints: vi.fn(),
	unlockExhibits: vi.fn()
}));

type QueryChain = {
	select: Mock;
	is: Mock;
	gte: Mock;
	eq: Mock;
	order: Mock;
	upsert: Mock;
	maybeSingle: Mock;
	then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
};

function query(result: unknown): QueryChain {
	const chain: QueryChain = {
		select: vi.fn(() => chain),
		is: vi.fn(() => chain),
		gte: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		order: vi.fn(() => chain),
		upsert: vi.fn(() => chain),
		maybeSingle: vi.fn(() => Promise.resolve(result)),
		then: (resolve) => Promise.resolve(result).then(resolve)
	};
	return chain;
}

const from = vi.mocked(supabase.from);

function tables(results: Record<string, unknown>): Record<string, QueryChain> {
	const chains = Object.fromEntries(
		Object.entries(results).map(([table, result]) => [table, query(result)])
	);
	from.mockImplementation(((table: string) => chains[table]) as never);
	return chains;
}

describe('standing data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(unlockExhibits).mockResolvedValue({ exhibits: [] });
		vi.mocked(loadPoints).mockResolvedValue({ points: 1846 });
	});

	it('unlocks the exhibits first and then reads the points, the new tiers and the rank seen', async () => {
		const chains = tables({
			exhibit_tiers: { data: [{ exhibit: 'collection', tier: 4 }], error: null },
			profiles: { data: { rank_seen: 4 }, error: null }
		});

		await expect(loadStanding()).resolves.toEqual({
			standing: { points: 1846, newTiers: 1, rankSeen: 4 }
		});
		expect(chains.exhibit_tiers.is).toHaveBeenCalledWith('seen_at', null);
		expect(chains.exhibit_tiers.gte).not.toHaveBeenCalled();
	});

	it('reads the standing without counting the exhibits again when they were just counted', async () => {
		tables({
			exhibit_tiers: { data: [], error: null },
			profiles: { data: { rank_seen: 4 }, error: null }
		});

		await expect(loadStanding(true)).resolves.toEqual({
			standing: { points: 1846, newTiers: 0, rankSeen: 4 }
		});
		expect(unlockExhibits).not.toHaveBeenCalled();
	});

	it('counts a learner without a profile as having seen no rank', async () => {
		tables({ exhibit_tiers: { data: [], error: null }, profiles: { data: null, error: null } });

		await expect(loadStanding()).resolves.toEqual({
			standing: { points: 1846, newTiers: 0, rankSeen: 0 }
		});
	});

	it('gives no standing when the exhibits cannot be unlocked', async () => {
		vi.mocked(unlockExhibits).mockResolvedValue({
			exhibits: [],
			error: m.collectionErrors.network
		});

		await expect(loadStanding()).resolves.toEqual({ error: m.collectionErrors.network });
		expect(from).not.toHaveBeenCalled();
	});

	it('gives no standing when a read fails', async () => {
		tables({
			exhibit_tiers: { data: null, error: { message: 'boom' } },
			profiles: { data: { rank_seen: 4 }, error: null }
		});

		expect((await loadStanding()).standing).toBeUndefined();
	});

	it('reads the plan of the day and the tiers lit since its start for the round summary', async () => {
		const day = new Date('2026-10-28T23:00:00Z');
		const chains = tables({
			point_events: { data: { plan_share: 1, streak_days: 12 }, error: null },
			exhibit_tiers: { data: [{ exhibit: 'collection', tier: 4 }], error: null },
			profiles: { data: { rank_seen: 4 }, error: null }
		});

		await expect(loadRoundCareer(day)).resolves.toEqual({
			round: {
				plan: { share: 1, streak: 12 },
				tiers: [{ exhibit: 'collection', tier: 4 }],
				points: 1846,
				rankSeen: 4
			}
		});
		expect(chains.point_events.eq).toHaveBeenCalledWith('day_start', day.toISOString());
		expect(chains.exhibit_tiers.gte).toHaveBeenCalledWith('unlocked_at', day.toISOString());
	});

	it('has no plan in the round summary on a day without one', async () => {
		tables({
			point_events: { data: null, error: null },
			exhibit_tiers: { data: [], error: null },
			profiles: { data: { rank_seen: 5 }, error: null }
		});

		expect((await loadRoundCareer(new Date())).round?.plan).toBeUndefined();
	});

	it('gives no round summary when something fails', async () => {
		vi.mocked(unlockExhibits).mockResolvedValue({
			exhibits: [],
			error: m.collectionErrors.network
		});
		await expect(loadRoundCareer(new Date())).resolves.toEqual({
			error: m.collectionErrors.network
		});

		vi.mocked(unlockExhibits).mockResolvedValue({ exhibits: [] });
		tables({
			point_events: { data: null, error: { message: 'boom' } },
			exhibit_tiers: { data: [], error: null },
			profiles: { data: { rank_seen: 5 }, error: null }
		});
		expect((await loadRoundCareer(new Date())).round).toBeUndefined();
	});

	it('remembers the rank the learner has seen', async () => {
		const chains = tables({ profiles: { error: null } });

		await expect(markRankSeen(6)).resolves.toEqual({});
		expect(chains.profiles.upsert).toHaveBeenCalledWith({ rank_seen: 6 });

		tables({ profiles: { error: { message: 'boom' } } });
		expect((await markRankSeen(6)).error).toBeDefined();
	});
});
