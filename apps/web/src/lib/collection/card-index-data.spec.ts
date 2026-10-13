import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { deleteValue, loadCardIndex, saveValue } from './card-index-data.ts';
import type { CardIndexRecord } from './types.ts';

vi.mock('#lib/supabase.ts', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));

const rpc = vi.mocked(supabase.rpc);

function rpcResult(rows: unknown[], error: unknown = null): never {
	return { range: vi.fn().mockResolvedValue({ data: rows, error }) } as never;
}

function rpcCall(error: unknown = null): never {
	return Promise.resolve({ error }) as never;
}

const period: CardIndexRecord = { id: 'p1', category: 'period', name: 'Classical', count: 2 };
const style: CardIndexRecord = { id: 's1', category: 'style', name: 'Doric', count: 1 };

describe('loadCardIndex', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('maps the usage rows to the card index', async () => {
		rpc.mockImplementation(((name: string) => {
			if (name === 'value_usage') {
				return rpcResult([
					{ id: 'p1', category_code: 'period', name: 'Classical', artwork_count: 2 }
				]);
			}
			if (name === 'period_era_usage') {
				return rpcResult([
					{ period_id: 'p1', era_code: 'antiquity', artwork_count: 2 },
					{ period_id: 'p1', era_code: 'unknown', artwork_count: 0 }
				]);
			}
			return rpcResult([{ style_id: 's1', period_id: 'p1', artwork_count: 1 }]);
		}) as never);

		await expect(loadCardIndex()).resolves.toEqual({
			index: {
				values: [{ id: 'p1', category: 'period', name: 'Classical', count: 2 }],
				periodEras: [{ periodId: 'p1', eraCode: 'antiquity', count: 2 }],
				stylePeriods: [{ styleId: 's1', periodId: 'p1', count: 1 }]
			}
		});
	});

	it('reads every page of 1000 rows', async () => {
		const row = (n: number): Record<string, unknown> => ({
			id: `v${n}`,
			category_code: 'author',
			name: `Author ${n}`,
			artwork_count: 0
		});
		const pages = [Array.from({ length: 1000 }, (_, n) => row(n)), [row(1000)]];
		const valueRanges: [number, number][] = [];
		rpc.mockImplementation(((name: string) => {
			if (name !== 'value_usage') return rpcResult([]);
			return {
				range: vi.fn((from: number, to: number) => {
					valueRanges.push([from, to]);
					return Promise.resolve({ data: pages[valueRanges.length - 1], error: null });
				})
			};
		}) as never);

		const { index } = await loadCardIndex();

		expect(index.values).toHaveLength(1001);
		expect(valueRanges).toEqual([
			[0, 999],
			[1000, 1999]
		]);
	});

	it('reports a failed request with an empty index', async () => {
		rpc.mockImplementation((() => rpcResult([], { message: 'Failed to fetch' })) as never);

		const result = await loadCardIndex();

		expect(result.error).toBe(m.collectionErrors.network);
		expect(result.index.values).toEqual([]);
	});
});

describe('saveValue', () => {
	const update = { eq: vi.fn() };

	beforeEach(() => {
		vi.clearAllMocks();
		rpc.mockImplementation((() => rpcCall()) as never);
		update.eq.mockResolvedValue({ error: null });
		vi.mocked(supabase.from).mockReturnValue({ update: vi.fn().mockReturnValue(update) } as never);
	});

	it('does nothing when nothing changed', async () => {
		await expect(saveValue({ record: style, name: 'Doric' })).resolves.toEqual({});

		expect(rpc).not.toHaveBeenCalled();
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('renames a value', async () => {
		await expect(saveValue({ record: style, name: 'Doric order' })).resolves.toEqual({});

		expect(supabase.from).toHaveBeenCalledWith('category_values');
		expect(update.eq).toHaveBeenCalledWith('id', 's1');
	});

	it('sets the eras of a period with the era artworks move to', async () => {
		await saveValue({
			record: period,
			name: 'Classical',
			eraCodes: ['early_modern'],
			moveTo: 'early_modern'
		});

		expect(rpc).toHaveBeenCalledWith('set_period_eras', {
			target_period: 'p1',
			era_codes: ['early_modern'],
			move_to: 'early_modern'
		});
	});

	it('sets the periods of a style', async () => {
		await saveValue({ record: style, name: 'Doric', periodIds: ['p1', 'p2'] });

		expect(rpc).toHaveBeenCalledWith('set_style_periods', {
			target_style: 's1',
			period_ids: ['p1', 'p2']
		});
	});

	it('saves the links before merging into another value', async () => {
		await saveValue({
			record: period,
			name: 'Classical',
			eraCodes: ['antiquity'],
			mergeInto: { id: 'p2', category: 'period', name: 'Classic', count: 1 }
		});

		expect(rpc.mock.calls.map(([name]) => name)).toEqual([
			'set_period_eras',
			'merge_category_values'
		]);
		expect(rpc).toHaveBeenLastCalledWith('merge_category_values', {
			merged_id: 'p1',
			kept_id: 'p2'
		});
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('stops at the first failure and explains it', async () => {
		rpc.mockImplementation((() => rpcCall({ code: '23001' })) as never);

		const result = await saveValue({
			record: style,
			name: 'Doric order',
			periodIds: []
		});

		expect(result).toEqual({ error: m.cardIndex.errors.changed });
		expect(supabase.from).not.toHaveBeenCalled();
	});
});

describe('deleteValue', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes an unused value', async () => {
		rpc.mockReturnValue(rpcCall());

		await expect(deleteValue('s1')).resolves.toEqual({});
		expect(rpc).toHaveBeenCalledWith('delete_unused_value', { target_value: 's1' });
	});

	it('explains that a value is still used', async () => {
		rpc.mockReturnValue(rpcCall({ code: '23001' }));

		await expect(deleteValue('s1')).resolves.toEqual({ error: m.cardIndex.errors.changed });
	});
});
