import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { mockNotesMentions, valueNote, artworkNote } from '#lib/testing/mentions/mentions.ts';
import { loadNoteLinkLabels } from './note-link-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

describe('loadNoteLinkLabels', () => {
	beforeEach(() => vi.clearAllMocks());

	it('names the links of one note from their stored targets', async () => {
		mockNotesMentions([
			artworkNote(12, 'Doric temple', ''),
			valueNote('style', 'style-doric', '', 'Doric'),
			valueNote('era', 'antiquity', '')
		]);

		const links = await loadNoteLinkLabels({ visitId: 'visit-1' });

		expect(supabase.rpc).toHaveBeenCalledTimes(1);
		expect(supabase.rpc).toHaveBeenCalledWith('note_link_labels', { visit_id: 'visit-1' });
		expect(supabase.from).not.toHaveBeenCalled();
		expect(links?.resolve('/atelier/12')).toBe('#0012 Doric temple');
		expect(links?.resolve('/atelier/0012')).toBe('#0012 Doric temple');
		expect(links?.resolve('/atelier/values/style/style-doric')).toBe('Doric');
		expect(links?.resolve('/atelier/values/era/antiquity')).toBe(m.eras.antiquity.name);
		expect(links?.resolve('/atelier/13')).toBeUndefined();
		expect(links?.suggest('#', 'Dor')).toEqual([]);
	});

	it('leaves out a kind or an era it does not know', async () => {
		mockNotesMentions([
			valueNote('type', 'painting', '', 'Painting'),
			valueNote('era', 'bronze', '')
		]);

		const links = await loadNoteLinkLabels({ artworkNumber: 3 });

		expect(links?.resolve('/atelier/values/type/painting')).toBeUndefined();
		expect(links?.resolve('/atelier/values/era/bronze')).toBeUndefined();
	});

	it('gives no labels when the read fails', async () => {
		mockNotesMentions([], { message: 'failed' });

		await expect(loadNoteLinkLabels({ eraCode: 'modern' })).resolves.toBeUndefined();
	});
});
