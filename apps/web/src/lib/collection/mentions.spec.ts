import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { loadMentions } from './mentions.ts';

vi.mock('#lib/supabase.ts', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }));

type Rows = Record<string, unknown[]>;

function mockTables(tables: Rows): void {
	vi.mocked(supabase.from).mockImplementation(((table: string) => {
		const query = {
			select: vi.fn().mockReturnThis(),
			is: vi.fn().mockReturnThis(),
			not: vi.fn().mockReturnThis(),
			like: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			range: vi.fn().mockResolvedValue({ data: tables[table] ?? [], error: null }),
			then: (resolve: (value: unknown) => unknown) =>
				resolve({ data: tables[table] ?? [], error: null })
		};
		return query;
	}) as never);
}

describe('loadMentions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the values and the artworks whose notes link to the page', async () => {
		mockTables({
			artworks: [
				{
					record_number: 3,
					title: 'Doric temple',
					notes: 'See [x](/atelier/values/style/style-doric).'
				}
			],
			author_details: [
				{
					value_id: 'author-phidias',
					notes: 'Built in [Doric](/atelier/values/style/style-doric).'
				}
			]
		});

		const mentions = await loadMentions('/atelier/values/style/style-doric', testCardIndex());

		expect(mentions).toEqual([
			{ href: '/atelier/values/author/author-phidias', name: 'Phidias', kind: 'Autor' },
			{ href: '/atelier/3', name: '#0003 Doric temple', kind: m.mentions.artwork }
		]);
	});

	it('does not match a longer record number or the page itself', async () => {
		mockTables({
			artworks: [
				{ record_number: 5, title: 'Other', notes: 'See [x](/atelier/120).' },
				{ record_number: 12, title: 'Itself', notes: 'See [x](/atelier/12).' },
				{ record_number: 6, title: 'Linking', notes: 'See [x](/atelier/12).' }
			]
		});

		const mentions = await loadMentions('/atelier/12');

		expect(mentions.map((mention) => mention.href)).toEqual(['/atelier/6']);
	});

	it('gives nothing when no note links there', async () => {
		mockTables({});

		await expect(loadMentions('/atelier/12')).resolves.toEqual([]);
		expect(supabase.rpc).not.toHaveBeenCalled();
	});
});
