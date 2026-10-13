import { beforeEach, describe, expect, it, vi } from 'vitest';
import { locale, m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import {
	emptyCategoryValues,
	loadCategoryValues,
	startingValues,
	takesOneValue
} from './category-values.ts';

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

		await expect(loadCategoryValues()).resolves.toEqual({ values: emptyCategoryValues() });
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
			}
		});
	});

	it('returns no values and a message when the request fails', async () => {
		query.is.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });

		await expect(loadCategoryValues()).resolves.toEqual({
			values: emptyCategoryValues(),
			error: m.common.unexpectedError
		});
	});
});

describe('startingValues', () => {
	it('offers starting lists for period, style and material only', () => {
		expect(startingValues('period')).toEqual(m.startingValues.period);
		expect(startingValues('style')).toEqual(
			[...m.startingValues.style].sort((a, b) => a.localeCompare(b, locale))
		);
		expect(startingValues('material')).toEqual(
			[...m.startingValues.material].sort((a, b) => a.localeCompare(b, locale))
		);
		expect(startingValues('author')).toEqual([]);
		expect(startingValues('location')).toEqual([]);
	});

	it('sorts styles and materials alphabetically in the interface language', () => {
		expect(startingValues('style').slice(0, 3)).toEqual(['abstrakcjonizm', 'barok', 'dadaizm']);
		expect(startingValues('material').slice(-3)).toEqual(['węgiel', 'złoto', 'żelbet']);
	});

	it('keeps periods in chronological order', () => {
		expect(startingValues('period')[0]).toBe('prehistoria');
		expect(startingValues('period').at(-1)).toBe('sztuka współczesna');
	});
});

describe('takesOneValue', () => {
	it('allows one value for the location and many for other categories', () => {
		expect(takesOneValue('location')).toBe(true);
		expect(takesOneValue('author')).toBe(false);
	});
});
