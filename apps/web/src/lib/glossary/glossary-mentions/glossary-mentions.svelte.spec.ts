import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
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
			valueNote('author', 'author-phidias', 'Known for the tympanum.', 'Phidias'),
			artworkNote(3, 'Temple', 'The Tympanum shows a battle.'),
			artworkNote(4, 'Other', 'Carved tympana everywhere.'),
			artworkNote(6, 'Synonym', 'A tympan with saints.')
		]);

		const mentions = await loadGlossaryMentions(
			testEntry('a-tympanum', 'Tympanum', { synonyms: ['tympan'], forms: ['tympana'] })
		);

		expect(mentions.map((mention) => mention.name)).toEqual([
			'Phidias',
			'#0003 Temple',
			'#0004 Other',
			'#0006 Synonym'
		]);
		expect(supabase.rpc).toHaveBeenCalledWith('term_mentions', {
			needles: ['Tympanum', 'tympan', 'tympana']
		});
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('names the values from the database and the eras from the app texts', async () => {
		mockNotesMentions([
			valueNote('style', 'style-doric', 'A tympanum.', 'Doric'),
			valueNote('era', 'antiquity', 'A tympanum.'),
			valueNote('era', 'unknown-era', 'A tympanum.'),
			valueNote('unknown', 'x', 'A tympanum.', 'X')
		]);

		const mentions = await loadGlossaryMentions(testEntry('a-tympanum', 'Tympanum'));

		expect(mentions).toEqual([
			{
				href: '/atelier/values/style/style-doric',
				name: 'Doric',
				kind: m.cardIndex.kinds.style.name
			},
			{
				href: '/atelier/values/era/antiquity',
				name: m.eras.antiquity.name,
				kind: m.valuePage.eraKind
			}
		]);
	});

	it('skips notes where the word only appears inside a link or as part of a longer word', async () => {
		mockNotesMentions([
			artworkNote(3, 'Linked', 'See [tympanum](/atelier/1).'),
			artworkNote(4, 'Longer', 'The tympanums are lost.')
		]);

		const mentions = await loadGlossaryMentions(testEntry('a-tympanum', 'Tympanum'));

		expect(mentions).toEqual([]);
	});

	it('gives nothing when the search fails', async () => {
		mockNotesMentions([], { message: 'failed' });

		await expect(loadGlossaryMentions(testEntry('a-tympanum', 'Tympanum'))).resolves.toEqual([]);
	});
});
