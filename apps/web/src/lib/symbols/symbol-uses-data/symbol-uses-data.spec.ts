import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadSymbolUses } from './symbol-uses-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const query = { select: vi.fn(), eq: vi.fn() };

function answer(result: unknown): void {
	query.select.mockReturnValue(query);
	query.eq.mockResolvedValue(result);
	vi.mocked(supabase.from).mockReturnValue(query as never);
}

describe('symbol uses data', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the symbols of a label sorted by name, with their meanings', async () => {
		answer({
			data: [
				{ symbol_meanings: { text: 'Heaven', symbols: { id: 'b', name: 'Keys' } } },
				{ symbol_meanings: { text: 'Purity', symbols: { id: 'a', name: 'Lily' } } }
			],
			error: null
		});

		await expect(loadSymbolUses({ valueId: 'value-1' })).resolves.toEqual({
			uses: [
				{ symbolId: 'b', name: 'Keys', meaning: 'Heaven' },
				{ symbolId: 'a', name: 'Lily', meaning: 'Purity' }
			]
		});
		expect(supabase.from).toHaveBeenCalledWith('symbol_meaning_contexts');
		expect(query.eq).toHaveBeenCalledWith('value_id', 'value-1');
	});

	it('filters by the era code or the glossary entry', async () => {
		answer({ data: [], error: null });

		await loadSymbolUses({ eraCode: 'baroque' });
		await loadSymbolUses({ glossaryEntryId: 'person-1' });

		expect(query.eq).toHaveBeenNthCalledWith(1, 'era_code', 'baroque');
		expect(query.eq).toHaveBeenNthCalledWith(2, 'glossary_entry_id', 'person-1');
	});

	it('says so when the symbols cannot be loaded', async () => {
		answer({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadSymbolUses({ valueId: 'value-1' })).resolves.toEqual({
			uses: [],
			error: m.common.network
		});
	});
});
