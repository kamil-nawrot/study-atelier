import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import type { ValueSubject } from './types.ts';
import { loadValueDetails, saveValueDetails, valueDetailsChanged } from './value-details.ts';

vi.mock('#lib/supabase.ts', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));

const style: ValueSubject = {
	kind: 'style',
	record: { id: 's1', category: 'style', name: 'Doric', count: 1 }
};
const era: ValueSubject = { kind: 'era', code: 'antiquity' };

function detailsTable(row: unknown, error: unknown = null): { eq: ReturnType<typeof vi.fn> } {
	const query = {
		select: vi.fn(),
		eq: vi.fn(),
		maybeSingle: vi.fn().mockResolvedValue({ data: row, error })
	};
	query.select.mockReturnValue(query);
	query.eq.mockReturnValue(query);
	vi.mocked(supabase.from).mockReturnValue(query as never);
	return query;
}

describe('loadValueDetails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads the details of a value from the table of its kind', async () => {
		const query = detailsTable({ summary: 'Plain capitals.', notes: null });

		await expect(loadValueDetails(style)).resolves.toEqual({
			details: { summary: 'Plain capitals.', notes: '' }
		});
		expect(supabase.from).toHaveBeenCalledWith('style_details');
		expect(query.eq).toHaveBeenCalledWith('value_id', 's1');
	});

	it('reads the details of an era by its code', async () => {
		const query = detailsTable(null);

		await expect(loadValueDetails(era)).resolves.toEqual({ details: { summary: '', notes: '' } });
		expect(supabase.from).toHaveBeenCalledWith('era_details');
		expect(query.eq).toHaveBeenCalledWith('era_code', 'antiquity');
	});

	it('reports a failed read', async () => {
		detailsTable(null, { message: 'Failed to fetch' });

		const result = await loadValueDetails(style);

		expect(result.error).toBe(m.collectionErrors.network);
	});
});

describe('saveValueDetails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
	});

	it('saves the trimmed details of a value', async () => {
		await expect(
			saveValueDetails(style, { summary: ' Plain. ', notes: 'Notes\n' })
		).resolves.toEqual({});
		expect(supabase.rpc).toHaveBeenCalledWith('save_value_details', {
			target_value: 's1',
			details: { summary: 'Plain.', notes: 'Notes' }
		});
	});

	it('saves the details of an era', async () => {
		await saveValueDetails(era, { summary: 'Greece and Rome.', notes: '' });

		expect(supabase.rpc).toHaveBeenCalledWith('save_era_details', {
			target_era: 'antiquity',
			details: { summary: 'Greece and Rome.', notes: '' }
		});
	});

	it('reports a failed save', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ error: { code: '23514' } } as never);

		await expect(saveValueDetails(style, { summary: 'x', notes: '' })).resolves.toEqual({
			error: m.cardIndex.errors.changed
		});
	});
});

describe('valueDetailsChanged', () => {
	it('ignores spaces around the summary', () => {
		expect(valueDetailsChanged({ summary: 'A ', notes: '' }, { summary: 'A', notes: '' })).toBe(
			false
		);
		expect(valueDetailsChanged({ summary: 'A', notes: 'x' }, { summary: 'A', notes: '' })).toBe(
			true
		);
	});
});
