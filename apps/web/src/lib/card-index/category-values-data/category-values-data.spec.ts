import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { loadCategoryValues, loadVisitPlaces } from './category-values-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

const used = {
	range: vi.fn()
};

const visits = {
	select: vi.fn()
};

function value(category_code: string, name: string): Record<string, string> {
	return { category_code, name };
}

describe('loadCategoryValues', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockReturnValue(used as never);
		vi.mocked(supabase.from).mockReturnValue(visits as never);
	});

	it('asks the database for the values in use, page by page', async () => {
		used.range.mockResolvedValue({ data: [], error: null });

		await expect(loadCategoryValues()).resolves.toEqual({
			values: emptyCategoryValues(),
			ownValues: {}
		});
		expect(supabase.rpc).toHaveBeenCalledWith('used_category_values');
		expect(used.range).toHaveBeenCalledWith(0, 999);
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('reads the next page when a page is full', async () => {
		const page = Array.from({ length: 1000 }, (_, index) => value('author', `Painter ${index}`));
		used.range
			.mockResolvedValueOnce({ data: page, error: null })
			.mockResolvedValueOnce({ data: [value('author', 'Zoe Painter')], error: null });

		const { values } = await loadCategoryValues();

		expect(used.range).toHaveBeenLastCalledWith(1000, 1999);
		expect(values.author).toHaveLength(1001);
	});

	it('groups values by category in alphabetical order', async () => {
		used.range.mockResolvedValue({
			data: [
				value('author', 'Zoe Painter'),
				value('style', 'gotyk'),
				value('author', 'Ann Sculptor'),
				value('location', 'Łódź'),
				value('location', 'Lyon')
			],
			error: null
		});

		await expect(loadCategoryValues()).resolves.toEqual({
			values: {
				author: ['Ann Sculptor', 'Zoe Painter'],
				period: [],
				style: ['gotyk'],
				material: [],
				location: ['Lyon', 'Łódź']
			},
			ownValues: {}
		});
	});

	it('collects the values of own lists apart, keyed by the field', async () => {
		used.range.mockResolvedValue({
			data: [
				value('lecture-id', 'Renaissance class'),
				value('style', 'gotyk'),
				value('lecture-id', 'Baroque class')
			],
			error: null
		});

		const { values, ownValues } = await loadCategoryValues();

		expect(values.style).toEqual(['gotyk']);
		expect(ownValues).toEqual({ 'lecture-id': ['Baroque class', 'Renaissance class'] });
	});

	it('returns no values and a message when the request fails', async () => {
		used.range.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });

		await expect(loadCategoryValues()).resolves.toEqual({
			values: emptyCategoryValues(),
			ownValues: {},
			error: m.common.unexpectedError
		});
	});
});

describe('loadVisitPlaces', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(visits as never);
	});

	it('names each place of a visit once', async () => {
		visits.select.mockResolvedValue({
			data: [
				{ category_values: { name: 'Orsay' } },
				{ category_values: { name: 'Orsay' } },
				{ category_values: null }
			],
			error: null
		});

		await expect(loadVisitPlaces()).resolves.toEqual({ places: ['Orsay'] });
	});
});
