import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { valueKindName } from '#lib/card-index/value-pages/value-pages.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	artworkNote,
	mockNotesMentions,
	valueNote,
	visitNote
} from '#lib/testing/mentions/mentions.ts';
import { loadMentions } from './mentions-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

describe('loadMentions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists the values and the artworks whose notes link to the page', async () => {
		mockNotesMentions([
			valueNote('author', 'author-phidias', '', 'Phidias'),
			artworkNote(3, 'Doric temple', '')
		]);

		const mentions = await loadMentions(
			{ valueId: 'style-doric' },
			'/atelier/values/style/style-doric'
		);

		expect(supabase.rpc).toHaveBeenCalledTimes(1);
		expect(supabase.rpc).toHaveBeenCalledWith('note_link_mentions', { value_id: 'style-doric' });
		expect(mentions).toEqual([
			{
				href: '/atelier/values/author/author-phidias',
				name: 'Phidias',
				kind: valueKindName('author')
			},
			{ href: '/atelier/3', name: '#0003 Doric temple', kind: m.mentions.artwork }
		]);
	});

	it('names an era from the app texts', async () => {
		mockNotesMentions([valueNote('era', 'antiquity', '')]);

		const mentions = await loadMentions({ artworkNumber: 12 }, '/atelier/12');

		expect(supabase.rpc).toHaveBeenCalledWith('note_link_mentions', { artwork_number: 12 });
		expect(mentions).toEqual([
			{
				href: '/atelier/values/era/antiquity',
				name: m.eras.antiquity.name,
				kind: valueKindName('era')
			}
		]);
	});

	it('lists the visits whose notes link to the page after the artworks', async () => {
		mockNotesMentions([
			visitNote('visit-1', 'Louvre · 12.10.2026', ''),
			artworkNote(3, 'Doric temple', '')
		]);

		const mentions = await loadMentions({ artworkNumber: 12 }, '/atelier/12');

		expect(mentions).toEqual([
			{ href: '/atelier/3', name: '#0003 Doric temple', kind: m.mentions.artwork },
			{
				href: '/atelier/chronicle/visit-1',
				name: 'Louvre · 12.10.2026',
				kind: m.mentions.visit
			}
		]);
	});

	it('leaves out the page itself', async () => {
		mockNotesMentions([
			artworkNote(6, 'Linking', ''),
			artworkNote(12, 'Itself', ''),
			valueNote('era', 'modern', '')
		]);

		const artwork = await loadMentions({ artworkNumber: 12 }, '/atelier/12');
		const era = await loadMentions({ eraCode: 'modern' }, '/atelier/values/era/modern');

		expect(artwork.map((mention) => mention.href)).toEqual([
			'/atelier/values/era/modern',
			'/atelier/6'
		]);
		expect(era.map((mention) => mention.href)).toEqual(['/atelier/6', '/atelier/12']);
	});

	it('gives nothing when the read fails', async () => {
		mockNotesMentions([], { message: 'failed' });

		await expect(loadMentions({ artworkNumber: 12 }, '/atelier/12')).resolves.toEqual([]);
	});
});
