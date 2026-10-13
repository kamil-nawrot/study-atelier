import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { buildValueLinks, emptyValueLinks, loadValueLinks } from './value-links.ts';

vi.mock('#lib/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

const values = [
	{ id: 'p1', category_code: 'period', name: 'Baroque' },
	{ id: 'p2', category_code: 'period', name: 'Renaissance' },
	{ id: 'p3', category_code: 'period', name: 'Łódź school' },
	{ id: 's1', category_code: 'style', name: 'tenebrism' },
	{ id: 's2', category_code: 'style', name: 'Mannerism' },
	{ id: 's3', category_code: 'style', name: 'Łaskawy' }
];

describe('emptyValueLinks', () => {
	it('has an empty list of periods for every era and no styles', () => {
		const links = emptyValueLinks();

		expect(Object.keys(links.periodsByEra)).toEqual([
			'prehistory',
			'antiquity',
			'middle_ages',
			'early_modern',
			'modern',
			'contemporary'
		]);
		expect(Object.values(links.periodsByEra).flat()).toEqual([]);
		expect(links.stylesByPeriod).toEqual({});
	});
});

describe('buildValueLinks', () => {
	it('lists the periods of each era alphabetically in the interface language', () => {
		const links = buildValueLinks(
			values,
			[
				{ value_id: 'p3', era_code: 'early_modern' },
				{ value_id: 'p2', era_code: 'early_modern' },
				{ value_id: 'p1', era_code: 'early_modern' }
			],
			[]
		);

		expect(links.periodsByEra.early_modern).toEqual(['Baroque', 'Łódź school', 'Renaissance']);
		expect(links.periodsByEra.modern).toEqual([]);
	});

	it('lets one period belong to several eras', () => {
		const links = buildValueLinks(
			values,
			[
				{ value_id: 'p1', era_code: 'early_modern' },
				{ value_id: 'p1', era_code: 'modern' }
			],
			[]
		);

		expect(links.periodsByEra.early_modern).toEqual(['Baroque']);
		expect(links.periodsByEra.modern).toEqual(['Baroque']);
	});

	it('lists the styles of each period under the period name without case and diacritics', () => {
		const links = buildValueLinks(
			values,
			[],
			[
				{ style_id: 's2', period_id: 'p2' },
				{ style_id: 's1', period_id: 'p1' },
				{ style_id: 's3', period_id: 'p1' },
				{ style_id: 's2', period_id: 'p1' }
			]
		);

		expect(links.stylesByPeriod).toEqual({
			baroque: ['Łaskawy', 'Mannerism', 'tenebrism'],
			renaissance: ['Mannerism']
		});
	});

	it('ignores links to values it does not know and to an unknown era', () => {
		const links = buildValueLinks(
			values,
			[
				{ value_id: 'missing', era_code: 'modern' },
				{ value_id: 'p1', era_code: 'stone_age' }
			],
			[{ style_id: 'missing', period_id: 'p1' }]
		);

		expect(links).toEqual(emptyValueLinks());
	});
});

describe('loadValueLinks', () => {
	function table(result: { data: unknown; error: unknown }): unknown {
		const select = vi.fn().mockReturnValue({
			in: vi.fn().mockResolvedValue(result),
			then: (resolve: (value: unknown) => void) => resolve(result)
		});
		return { select };
	}

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads the period and style names and both link tables', async () => {
		vi.mocked(supabase.from).mockImplementation(((name: string) => {
			if (name === 'category_values') return table({ data: values, error: null });
			if (name === 'period_eras') {
				return table({ data: [{ value_id: 'p1', era_code: 'early_modern' }], error: null });
			}
			return table({ data: [{ style_id: 's1', period_id: 'p1' }], error: null });
		}) as never);

		const { links, error } = await loadValueLinks();

		expect(error).toBeUndefined();
		expect(links.periodsByEra.early_modern).toEqual(['Baroque']);
		expect(links.stylesByPeriod).toEqual({ baroque: ['tenebrism'] });
		expect(supabase.from).toHaveBeenCalledWith('category_values');
		expect(supabase.from).toHaveBeenCalledWith('period_eras');
		expect(supabase.from).toHaveBeenCalledWith('style_periods');
	});

	it('returns no links and a message when a request fails', async () => {
		vi.mocked(supabase.from).mockImplementation(((name: string) =>
			table(
				name === 'period_eras'
					? { data: null, error: { code: 'XX000', message: 'boom' } }
					: { data: [], error: null }
			)) as never);

		await expect(loadValueLinks()).resolves.toEqual({
			links: emptyValueLinks(),
			error: m.common.unexpectedError
		});
	});
});
