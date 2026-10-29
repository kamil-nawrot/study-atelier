import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	loadDisplayCase,
	loadPoints,
	loadUnlockedTiers,
	markTiersSeen,
	unlockExhibits
} from './career-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), from: vi.fn() }
}));

const rpc = vi.mocked(supabase.rpc);
const from = vi.mocked(supabase.from);

type QueryChain = {
	select: Mock;
	order: Mock;
	update: Mock;
	is: Mock;
	then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
};

function query(result: unknown): QueryChain {
	const chain: QueryChain = {
		select: vi.fn(() => chain),
		order: vi.fn(() => chain),
		update: vi.fn(() => chain),
		is: vi.fn(() => chain),
		then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve)
	};
	return chain;
}

describe('career data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the points of the learner', async () => {
		rpc.mockResolvedValue({ data: 1846, error: null } as never);
		await expect(loadPoints()).resolves.toEqual({ points: 1846 });
		expect(rpc).toHaveBeenCalledWith('learner_points');
	});

	it('returns no points and a message when the points fail', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'TypeError: Failed to fetch' }
		} as never);
		await expect(loadPoints()).resolves.toEqual({ points: 0, error: m.collectionErrors.network });
	});

	it('unlocks the exhibits in the learner time zone', async () => {
		const exhibits = [{ exhibit: 'collection', value: 12, thresholds: [1, 10, 50] }];
		rpc.mockResolvedValue({ data: exhibits, error: null } as never);
		await expect(unlockExhibits()).resolves.toEqual({ exhibits });
		expect(rpc).toHaveBeenCalledWith('unlock_exhibits', {
			time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});
	});

	it('returns no exhibits and a message when unlocking fails', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'TypeError: Failed to fetch' }
		} as never);
		await expect(unlockExhibits()).resolves.toEqual({
			exhibits: [],
			error: m.collectionErrors.network
		});
	});

	it('loads the unlocked tiers with their dates', async () => {
		from.mockReturnValue(
			query({
				data: [
					{ exhibit: 'collection', tier: 1, unlocked_at: '2026-10-01T10:00:00Z', seen_at: null },
					{
						exhibit: 'collection',
						tier: 2,
						unlocked_at: '2026-10-02T10:00:00Z',
						seen_at: '2026-10-03T10:00:00Z'
					}
				],
				error: null
			}) as never
		);
		await expect(loadUnlockedTiers()).resolves.toEqual({
			tiers: [
				{
					exhibit: 'collection',
					tier: 1,
					unlockedAt: new Date('2026-10-01T10:00:00Z'),
					seenAt: undefined
				},
				{
					exhibit: 'collection',
					tier: 2,
					unlockedAt: new Date('2026-10-02T10:00:00Z'),
					seenAt: new Date('2026-10-03T10:00:00Z')
				}
			]
		});
	});

	it('marks the new tiers as seen', async () => {
		const chain = query({ error: null });
		from.mockReturnValue(chain as never);
		await expect(markTiersSeen(new Date('2026-10-29T10:00:00Z'))).resolves.toEqual({});
		expect(chain.update).toHaveBeenCalledWith({ seen_at: '2026-10-29T10:00:00.000Z' });
		expect(chain.is).toHaveBeenCalledWith('seen_at', null);
	});

	it('unlocks the exhibits before it reads their tiers for the display case', async () => {
		rpc.mockResolvedValue({
			data: [{ exhibit: 'collection', value: 12, thresholds: [1, 10, 50] }],
			error: null
		} as never);
		from.mockReturnValue(
			query({
				data: [
					{ exhibit: 'collection', tier: 1, unlocked_at: '2026-10-01T10:00:00Z', seen_at: null }
				],
				error: null
			}) as never
		);
		await expect(loadDisplayCase()).resolves.toEqual({
			exhibits: [
				{
					code: 'collection',
					value: 12,
					thresholds: [1, 10, 50],
					tiers: [
						{
							exhibit: 'collection',
							tier: 1,
							unlockedAt: new Date('2026-10-01T10:00:00Z'),
							seenAt: undefined
						}
					]
				}
			]
		});
		expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(from.mock.invocationCallOrder[0]);
	});

	it('shows no display case when the exhibits cannot be counted', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'TypeError: Failed to fetch' }
		} as never);
		await expect(loadDisplayCase()).resolves.toEqual({
			exhibits: [],
			error: m.collectionErrors.network
		});
		expect(from).not.toHaveBeenCalled();
	});
});
