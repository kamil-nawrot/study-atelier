import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { artworkNote, mockNotesMentions, valueNote } from '#lib/testing/mentions.ts';
import { loadMentions } from './mentions.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

describe('loadMentions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the values and the artworks whose notes link to the page', async () => {
		mockNotesMentions([
			valueNote('author', 'author-phidias', 'Built in [Doric](/atelier/values/style/style-doric).'),
			artworkNote(3, 'Doric temple', 'See [x](/atelier/values/style/style-doric).')
		]);

		const mentions = await loadMentions('/atelier/values/style/style-doric', testCardIndex());

		expect(supabase.rpc).toHaveBeenCalledTimes(1);
		expect(supabase.rpc).toHaveBeenCalledWith('notes_mentions', {
			needle: '](/atelier/values/style/style-doric)'
		});
		expect(mentions).toEqual([
			{ href: '/atelier/values/author/author-phidias', name: 'Phidias', kind: 'Autor' },
			{ href: '/atelier/3', name: '#0003 Doric temple', kind: m.mentions.artwork }
		]);
	});

	it('does not match a longer record number or the page itself', async () => {
		mockNotesMentions([
			artworkNote(5, 'Other', 'See [x](/atelier/120).'),
			artworkNote(6, 'Linking', 'See [x](/atelier/12).'),
			artworkNote(12, 'Itself', 'See [x](/atelier/12).')
		]);

		const mentions = await loadMentions('/atelier/12');

		expect(mentions.map((mention) => mention.href)).toEqual(['/atelier/6']);
	});

	it('gives nothing when no note links there, without loading the card index', async () => {
		mockNotesMentions([]);

		await expect(loadMentions('/atelier/12')).resolves.toEqual([]);
		expect(supabase.rpc).toHaveBeenCalledTimes(1);
	});

	it('gives nothing when the search fails', async () => {
		mockNotesMentions([], { message: 'failed' });

		await expect(loadMentions('/atelier/12')).resolves.toEqual([]);
	});
});
