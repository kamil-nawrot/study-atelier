import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { artworkNote, mockNotesMentions, valueNote } from '#lib/testing/mentions/mentions.ts';
import { loadGlossaryMentions } from './glossary-mentions.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

describe('loadGlossaryMentions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the artworks and values whose notes contain the entry, one of its synonyms or forms', async () => {
		mockNotesMentions([
			valueNote('author', 'author-phidias', 'Known for the tympanum.'),
			artworkNote(3, 'Temple', 'The Tympanum shows a battle.'),
			artworkNote(4, 'Other', 'Carved tympana everywhere.'),
			artworkNote(5, 'Unrelated', 'Only a fresco.'),
			artworkNote(6, 'Synonym', 'A tympan with saints.')
		]);

		const mentions = await loadGlossaryMentions(
			testEntry('a-tympanum', 'Tympanum', { synonyms: ['tympan'], forms: ['tympana'] }),
			testCardIndex()
		);

		expect(mentions.map((mention) => mention.name)).toEqual([
			'Phidias',
			'#0003 Temple',
			'#0004 Other',
			'#0006 Synonym'
		]);
		expect(supabase.rpc).toHaveBeenCalledWith('notes_mentions', {});
	});

	it('skips notes where the word only appears inside a link or as part of a longer word', async () => {
		mockNotesMentions([
			artworkNote(3, 'Linked', 'See [tympanum](/atelier/1).'),
			artworkNote(4, 'Longer', 'The tympanums are lost.')
		]);

		const mentions = await loadGlossaryMentions(
			testEntry('a-tympanum', 'Tympanum'),
			testCardIndex()
		);

		expect(mentions).toEqual([]);
	});
});
