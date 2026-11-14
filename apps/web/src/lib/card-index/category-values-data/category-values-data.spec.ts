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
	select: vi.fn(),
	eq: vi.fn(),
	order: vi.fn(),
	range: vi.fn()
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
		visits.select.mockReturnValue(visits);
		visits.eq.mockReturnValue(visits);
		visits.order.mockReturnValue(visits);
	});

	it('names each place of a visit once, leaving the cities of trips out', async () => {
		visits.range.mockResolvedValueOnce({
			data: [
				{ category_values: { name: 'Orsay' } },
				{ category_values: { name: 'Orsay' } },
				{ category_values: null }
			],
			error: null
		});

		await expect(loadVisitPlaces()).resolves.toEqual({ places: ['Orsay'] });
		expect(visits.eq).toHaveBeenCalledWith('kind', 'visit');
		expect(visits.order).toHaveBeenCalledWith('id');
	});

	it('reads past the first 1000 visits', async () => {
		visits.range
			.mockResolvedValueOnce({
				data: Array.from({ length: 1000 }, () => ({ category_values: { name: 'Orsay' } })),
				error: null
			})
			.mockResolvedValueOnce({ data: [{ category_values: { name: 'Prado' } }], error: null });

		await expect(loadVisitPlaces()).resolves.toEqual({ places: ['Orsay', 'Prado'] });
		expect(visits.range).toHaveBeenNthCalledWith(2, 1000, 1999);
	});

	it('gives a message when the read fails', async () => {
		visits.range.mockResolvedValueOnce({ data: null, error: { code: 'XX000', message: 'boom' } });

		await expect(loadVisitPlaces()).resolves.toEqual({
			places: [],
			error: m.common.unexpectedError
		});
	});
});
