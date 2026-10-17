import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/supabase.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { testEntry } from '#lib/testing/glossary.ts';
import { loadGlossaryMentions } from './glossary-mentions.ts';

vi.mock('#lib/supabase.ts', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }));

type Rows = Record<string, unknown[]>;

function mockTables(tables: Rows): void {
	vi.mocked(supabase.from).mockImplementation(((table: string) => {
		const query = {
			select: vi.fn().mockReturnThis(),
			is: vi.fn().mockReturnThis(),
			not: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			range: vi.fn().mockResolvedValue({ data: tables[table] ?? [], error: null }),
			then: (resolve: (value: unknown) => unknown) =>
				resolve({ data: tables[table] ?? [], error: null })
		};
		return query;
	}) as never);
}

describe('loadGlossaryMentions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the artworks and values whose notes contain the entry or one of its forms', async () => {
		mockTables({
			artworks: [
				{ record_number: 3, title: 'Temple', notes: 'The Tympanum shows a battle.' },
				{ record_number: 4, title: 'Other', notes: 'Carved tympana everywhere.' },
				{ record_number: 5, title: 'Unrelated', notes: 'Only a fresco.' }
			],
			author_details: [{ value_id: 'author-phidias', notes: 'Known for the tympanum.' }]
		});

		const mentions = await loadGlossaryMentions(
			testEntry('a-tympanum', 'Tympanum', { forms: ['tympana'] }),
			testCardIndex()
		);

		expect(mentions.map((mention) => mention.name)).toEqual([
			'Phidias',
			'#0003 Temple',
			'#0004 Other'
		]);
	});

	it('skips notes where the word only appears inside a link or as part of a longer word', async () => {
		mockTables({
			artworks: [
				{ record_number: 3, title: 'Linked', notes: 'See [tympanum](/atelier/1).' },
				{ record_number: 4, title: 'Longer', notes: 'The tympanums are lost.' }
			]
		});

		const mentions = await loadGlossaryMentions(
			testEntry('a-tympanum', 'Tympanum'),
			testCardIndex()
		);

		expect(mentions).toEqual([]);
	});
});
