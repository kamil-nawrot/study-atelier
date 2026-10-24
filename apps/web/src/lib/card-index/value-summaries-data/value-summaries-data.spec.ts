import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { summaryKey } from '#lib/card-index/value-summaries/value-summaries.ts';
import { loadValueSummaries } from './value-summaries-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

function respond(values: unknown, eras: unknown, error: unknown = null): void {
	vi.mocked(supabase.from).mockImplementation(((table: string) => {
		if (table === 'artwork_values') {
			return {
				select: () => ({ eq: vi.fn().mockResolvedValue({ data: values, error }) })
			};
		}
		return { select: vi.fn().mockResolvedValue({ data: eras, error: null }) };
	}) as never);
}

describe('loadValueSummaries', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('keeps the summaries of the artwork values and the eras, with the years of an author and the country of a place', async () => {
		respond(
			[
				{
					category_values: {
						category_code: 'author',
						name: 'Leonardo da Vinci',
						author_details: [
							{ summary: 'Painter.', birth_year: 1452, death_year: 1519, years_approximate: false }
						]
					}
				},
				{
					category_values: {
						category_code: 'period',
						name: 'Renaissance',
						period_details: [{ summary: 'Revival.' }]
					}
				},
				{
					category_values: {
						category_code: 'location',
						name: 'Louvre',
						location_details: [{ summary: null, country_code: 'FR' }]
					}
				},
				{
					category_values: {
						category_code: 'location',
						name: 'Home',
						location_details: [{ summary: null, country_code: null }]
					}
				},
				{ category_values: { category_code: 'style', name: 'Mannerism', style_details: [] } },
				{
					category_values: {
						category_code: 'material',
						name: 'Oil',
						material_details: [{ summary: null }]
					}
				}
			],
			[
				{ era_code: 'early_modern', summary: 'Early modern.' },
				{ era_code: 'antiquity', summary: null }
			]
		);

		const summaries = await loadValueSummaries(1);

		expect(summaries.values).toEqual({
			[summaryKey('author', 'Leonardo da Vinci')]: { summary: 'Painter.', lifeYears: '1452–1519' },
			[summaryKey('period', 'Renaissance')]: { summary: 'Revival.' }
		});
		expect(summaries.eras).toEqual({ early_modern: { summary: 'Early modern.' } });
		expect(summaries.countries).toEqual({ Louvre: 'Francja' });
	});

	it('gives no summaries when the request fails', async () => {
		respond(null, [], { message: 'Failed to fetch' });

		await expect(loadValueSummaries(1)).resolves.toEqual({
			eras: {},
			values: {},
			countries: {}
		});
	});
});
