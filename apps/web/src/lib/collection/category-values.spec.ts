import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { emptyCategoryValues, loadCategoryValues, takesOneValue } from './category-values.ts';

vi.mock('#lib/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

const query = {
	select: vi.fn(),
	is: vi.fn()
};

function value(category_code: string, name: string): Record<string, unknown> {
	return { category_values: { category_code, name } };
}

describe('loadCategoryValues', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.select.mockReturnValue(query);
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

	it('returns no values and a message when the request fails', async () => {
		query.is.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });

		await expect(loadCategoryValues()).resolves.toEqual({
			values: emptyCategoryValues(),
			ownValues: {},
			error: m.common.unexpectedError
		});
	});
});

describe('takesOneValue', () => {
	it('allows one value for the location and many for other categories', () => {
		expect(takesOneValue('location')).toBe(true);
		expect(takesOneValue('author')).toBe(false);
	});
});
