import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	deleteValue,
	loadCardIndex,
	loadOwnValues,
	loadValuePageContent,
	saveValue
} from './card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), from: vi.fn() }
}));
vi.mock('#lib/images/own-image-data/own-image-data.ts', () => ({ removeOwnImage: vi.fn() }));

const rpc = vi.mocked(supabase.rpc);

function sortNames(rows: unknown[] = [], error: unknown = null): void {
	const query = {
		select: vi.fn(),
		not: vi.fn(),
		range: vi.fn().mockResolvedValue({ data: rows, error })
	};
	query.select.mockReturnValue(query);
	query.not.mockReturnValue(query);
	vi.mocked(supabase.from).mockReturnValue(query as never);
}

function rpcResult(rows: unknown[], error: unknown = null): never {
	return { range: vi.fn().mockResolvedValue({ data: rows, error }) } as never;
}

function rpcCall(error: unknown = null): never {
	return Promise.resolve({ error }) as never;
}

const period: CardIndexRecord = { id: 'p1', category: 'period', name: 'Classical', count: 2 };
const style: CardIndexRecord = { id: 's1', category: 'style', name: 'Doric', count: 1 };
const author: CardIndexRecord = { id: 'a1', category: 'author', name: 'Leonardo', count: 1 };
const keptAuthor: CardIndexRecord = {
	id: 'a2',
	category: 'author',
	name: 'Leonardo da Vinci',
	count: 2
};

function pageContent(row: { has_content: boolean; own_image_path: string | null }): never {
	return Promise.resolve({ data: [row], error: null }) as never;
}

function authorCalls(portrait: string | null, actionError: unknown = null): void {
	rpc.mockImplementation(((name: string) =>
		name === 'value_page_content'
			? pageContent({ has_content: portrait !== null, own_image_path: portrait })
			: rpcCall(actionError)) as never);
}

describe('loadCardIndex', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sortNames();
	});

	it('gives authors their sort names', async () => {
		sortNames([{ value_id: 'a1', sort_name: 'Vinci, Leonardo da' }]);
		rpc.mockImplementation(((name: string) =>
			rpcResult(
				name === 'value_usage'
					? [
							{ id: 'a1', category_code: 'author', name: 'Leonardo da Vinci', artwork_count: 1 },
							{ id: 'a2', category_code: 'author', name: 'Andy Warhol', artwork_count: 1 }
						]
					: []
			)) as never);

		const { index } = await loadCardIndex();

		expect(index.values).toEqual([
			{
				id: 'a1',
				category: 'author',
				name: 'Leonardo da Vinci',
				count: 1,
				sortName: 'Vinci, Leonardo da'
			},
			{ id: 'a2', category: 'author', name: 'Andy Warhol', count: 1 }
		]);
		expect(supabase.from).toHaveBeenCalledWith('author_details');
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
			},
			ownValues: []
		});
	});

	it('keeps the values of the learner own list fields apart from the card index', async () => {
		rpc.mockImplementation(((name: string) =>
			rpcResult(
				name === 'value_usage'
					? [
							{ id: 'p1', category_code: 'period', name: 'Classical', artwork_count: 2 },
							{
								id: 'f1',
								category_code: '7d1c3a52-1b4e-4c55-9d1e-0f2a7b6c8e90',
								name: 'Annunciation',
								artwork_count: 1
							}
						]
					: []
			)) as never);

		const { index, ownValues } = await loadCardIndex();

		expect(index.values).toEqual([{ id: 'p1', category: 'period', name: 'Classical', count: 2 }]);
		expect(ownValues).toEqual([
			{
				id: 'f1',
				fieldId: '7d1c3a52-1b4e-4c55-9d1e-0f2a7b6c8e90',
				name: 'Annunciation',
				count: 1
			}
		]);
	});

	it('loads only the values of own list fields without the rest of the card index', async () => {
		rpc.mockImplementation(((name: string) =>
			rpcResult(
				name === 'value_usage'
					? [
							{ id: 'p1', category_code: 'period', name: 'Classical', artwork_count: 2 },
							{ id: 'f1', category_code: 'field-id', name: 'Annunciation', artwork_count: 1 }
						]
					: []
			)) as never);

		await expect(loadOwnValues()).resolves.toEqual({
			ownValues: [{ id: 'f1', fieldId: 'field-id', name: 'Annunciation', count: 1 }]
		});
		expect(rpc).toHaveBeenCalledTimes(1);
	});

	it('reports a failure to load the values of own list fields', async () => {
		rpc.mockReturnValue(rpcResult([], { code: 'PGRST000', message: 'down' }));

		const { ownValues, error } = await loadOwnValues();

		expect(ownValues).toEqual([]);
		expect(error).toBeDefined();
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

		await expect(deleteValue(style)).resolves.toEqual({});
		expect(rpc).toHaveBeenCalledWith('delete_unused_value', { target_value: 's1' });
		expect(rpc).not.toHaveBeenCalledWith('value_page_content', expect.anything());
	});

	it('explains that a value is still used', async () => {
		rpc.mockReturnValue(rpcCall({ code: '23001' }));

		await expect(deleteValue(style)).resolves.toEqual({ error: m.cardIndex.errors.changed });
	});

	it('removes the uploaded portrait of a deleted author', async () => {
		authorCalls('owner/portrait.jpg');

		await expect(deleteValue(author)).resolves.toEqual({});
		expect(removeOwnImage).toHaveBeenCalledWith('owner/portrait.jpg');
	});

	it('keeps the portrait when deleting the author fails', async () => {
		authorCalls('owner/portrait.jpg', { code: '23001' });

		await expect(deleteValue(author)).resolves.toEqual({ error: m.cardIndex.errors.changed });
		expect(removeOwnImage).not.toHaveBeenCalled();
	});

	it('removes nothing from storage for an author without an uploaded portrait', async () => {
		authorCalls(null);

		await deleteValue(author);
		expect(removeOwnImage).not.toHaveBeenCalled();
	});
});

describe('merging authors', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('removes the uploaded portrait of the merged author', async () => {
		authorCalls('owner/portrait.jpg');

		await expect(
			saveValue({ record: author, name: keptAuthor.name, mergeInto: keptAuthor })
		).resolves.toEqual({});
		expect(rpc).toHaveBeenCalledWith('value_page_content', { target_value: 'a1' });
		expect(rpc).toHaveBeenCalledWith('merge_category_values', { merged_id: 'a1', kept_id: 'a2' });
		expect(removeOwnImage).toHaveBeenCalledWith('owner/portrait.jpg');
	});

	it('does not merge when the page content cannot be read', async () => {
		rpc.mockReturnValue(Promise.resolve({ data: null, error: { code: 'XX000' } }) as never);

		const result = await saveValue({
			record: author,
			name: keptAuthor.name,
			mergeInto: keptAuthor
		});

		expect(result.error).toBeDefined();
		expect(rpc).not.toHaveBeenCalledWith('merge_category_values', expect.anything());
	});
});

describe('loadValuePageContent', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('says whether the value has page content and where its uploaded portrait is', async () => {
		rpc.mockReturnValue(pageContent({ has_content: true, own_image_path: 'owner/portrait.jpg' }));

		await expect(loadValuePageContent('a1')).resolves.toEqual({
			content: { hasContent: true, ownImagePath: 'owner/portrait.jpg' }
		});
	});

	it('reports a value without page content', async () => {
		rpc.mockReturnValue(pageContent({ has_content: false, own_image_path: null }));

		await expect(loadValuePageContent('p1')).resolves.toEqual({
			content: { hasContent: false, ownImagePath: undefined }
		});
	});
});
