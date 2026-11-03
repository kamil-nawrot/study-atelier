import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadRoundCareer, loadStanding, markRankSeen } from './standing-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
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
const rpc = vi.mocked(supabase.rpc);

function tables(results: Record<string, unknown>): Record<string, QueryChain> {
	const chains = Object.fromEntries(
		Object.entries(results).map(([table, result]) => [table, query(result)])
	);
	from.mockImplementation(((table: string) => chains[table]) as never);
	return chains;
}

function standing(row: unknown, error: unknown = null): void {
	rpc.mockResolvedValue({ data: row ? [row] : [], error } as never);
}

describe('standing data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		standing({ points: 1846, new_tiers: 1, rank_seen: 4 });
	});

	it('unlocks the exhibits and reads the standing in one request', async () => {
		await expect(loadStanding()).resolves.toEqual({
			standing: { points: 1846, newTiers: 1, rankSeen: 4 }
		});
		expect(rpc).toHaveBeenCalledTimes(1);
		expect(rpc).toHaveBeenCalledWith('career_standing', {
			time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			unlock: true
		});
		expect(from).not.toHaveBeenCalled();
	});

	it('does not count the exhibits again when they were just counted', async () => {
		await loadStanding(true);

		expect(rpc).toHaveBeenCalledWith('career_standing', expect.objectContaining({ unlock: false }));
	});

	it('gives no standing when the request fails or returns nothing', async () => {
		standing(null, { message: 'TypeError: Failed to fetch' });
		await expect(loadStanding()).resolves.toEqual({ error: m.collectionErrors.network });

		standing(null);
		expect((await loadStanding()).standing).toBeUndefined();
	});

	it('reads the plan of the day and the tiers lit since its start for the round summary', async () => {
		const day = new Date('2026-10-28T23:00:00Z');
		const chains = tables({
			point_events: { data: { plan_share: 1, streak_days: 12 }, error: null },
			exhibit_tiers: { data: [{ exhibit: 'collection', tier: 4 }], error: null }
		});

		await expect(loadRoundCareer(day)).resolves.toEqual({
			round: {
				plan: { share: 1, streak: 12 },
				tiers: [{ exhibit: 'collection', tier: 4 }],
				points: 1846,
				rankSeen: 4
			}
		});
		expect(rpc).toHaveBeenCalledWith('career_standing', expect.objectContaining({ unlock: true }));
		expect(chains.point_events.eq).toHaveBeenCalledWith('day_start', day.toISOString());
		expect(chains.exhibit_tiers.is).toHaveBeenCalledWith('seen_at', null);
		expect(chains.exhibit_tiers.gte).toHaveBeenCalledWith('unlocked_at', day.toISOString());
	});

	it('has no plan in the round summary on a day without one', async () => {
		tables({
			point_events: { data: null, error: null },
			exhibit_tiers: { data: [], error: null }
		});

		expect((await loadRoundCareer(new Date())).round?.plan).toBeUndefined();
	});

	it('gives no round summary when something fails', async () => {
		standing(null, { message: 'TypeError: Failed to fetch' });
		tables({ point_events: { data: null, error: null } });
		await expect(loadRoundCareer(new Date())).resolves.toEqual({
			error: m.collectionErrors.network
		});
		expect(from).not.toHaveBeenCalledWith('exhibit_tiers');

		standing({ points: 1846, new_tiers: 0, rank_seen: 5 });
		tables({
			point_events: { data: null, error: { message: 'boom' } },
			exhibit_tiers: { data: [], error: null }
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
