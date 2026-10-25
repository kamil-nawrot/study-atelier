import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { loadCategoryValues, loadVisitPlaces } from './category-values-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

const query = {
	select: vi.fn(),
	is: vi.fn()
};

const visits = {
	select: vi.fn()
};

function value(category_code: string, name: string): Record<string, unknown> {
	return { category_values: { category_code, name } };
}

describe('loadCategoryValues', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockImplementation(
			(table: string) => (table === 'visits' ? visits : query) as never
		);
		query.select.mockReturnValue(query);
		visits.select.mockResolvedValue({ data: [], error: null });
	});

	it('reads values only through artworks outside the trash', async () => {
		query.is.mockResolvedValue({ data: [], error: null });

		await expect(loadCategoryValues()).resolves.toEqual({
			values: emptyCategoryValues(),
			ownValues: {}
		});
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.select).toHaveBeenCalledWith(
			'artwork_values(category_values(category_code, name))'
		);
		expect(query.is).toHaveBeenCalledWith('deleted_at', null);
	});

	it('groups values by category once each, in alphabetical order', async () => {
		query.is.mockResolvedValue({
			data: [
				{ artwork_values: [value('author', 'Zoe Painter'), value('style', 'gotyk')] },
				{
					artwork_values: [
						value('author', 'Ann Sculptor'),
						value('author', 'Zoe Painter'),
						value('location', 'Łódź'),
						value('location', 'Lyon'),
						{ category_values: null }
					]
				}
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
		query.is.mockResolvedValue({
			data: [
				{ artwork_values: [value('lecture-id', 'Renaissance class'), value('style', 'gotyk')] },
				{ artwork_values: [value('lecture-id', 'Baroque class')] }
			],
			error: null
		});

		const { values, ownValues } = await loadCategoryValues();

		expect(values.style).toEqual(['gotyk']);
		expect(ownValues).toEqual({ 'lecture-id': ['Baroque class', 'Renaissance class'] });
	});

	it('suggests the places of visits with the places of artworks', async () => {
		query.is.mockResolvedValue({
			data: [{ artwork_values: [value('location', 'Luwr')] }],
			error: null
		});
		visits.select.mockResolvedValue({
			data: [
				{ category_values: { name: 'Kościół Mariacki' } },
				{ category_values: { name: 'Luwr' } }
			],
			error: null
		});

		const { values } = await loadCategoryValues();

		expect(visits.select).toHaveBeenCalledWith('category_values(name)');
		expect(values.location).toEqual(['Kościół Mariacki', 'Luwr']);
	});

	it('keeps the values of artworks when the places of visits fail', async () => {
		query.is.mockResolvedValue({
			data: [{ artwork_values: [value('location', 'Luwr'), value('style', 'gotyk')] }],
			error: null
		});
		visits.select.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });

		const result = await loadCategoryValues();

		expect(result.error).toBeUndefined();
		expect(result.values.location).toEqual(['Luwr']);
		expect(result.values.style).toEqual(['gotyk']);
	});

	it('returns no values and a message when the request fails', async () => {
		query.is.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });

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
