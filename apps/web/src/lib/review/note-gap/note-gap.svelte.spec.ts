import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { loadNoteGap } from '#lib/review/review-data/review-data.ts';
import { drawNoteGap, noteGapItem, notePassages } from './note-gap.ts';

vi.mock('#lib/review/review-data/review-data.ts', () => ({ loadNoteGap: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

function term(
	name: string,
	category: GlossaryTerm['category'] = 'architecture',
	forms: string[] = []
): GlossaryTerm {
	return { id: name, name, category, synonyms: [], forms, hasDefinition: false };
}

const glossary = [
	term('tympanon', 'architecture', ['tympanonie']),
	term('archiwolta'),
	term('portal'),
	term('nawa'),
	term('sfumato', 'painting')
];
const chartres = testArtwork(1, 'Portal królewski w Chartres');
const notes = [
	'## Portal',
	'W **tympanonie** Chrystus w mandorli.\nTympanon otacza archiwolta.',
	'',
	'- tympanon: drugi, w Moissac',
	'- inne'
].join('\n');

describe('notePassages', () => {
	it('splits a note into paragraphs and list items as plain text, without headings', () => {
		expect(notePassages(notes)).toEqual([
			'W tympanonie Chrystus w mandorli. Tympanon otacza archiwolta.',
			'tympanon: drugi, w Moissac',
			'inne'
		]);
	});
});

describe('noteGapItem', () => {
	it('hides every form of the term in the first passage holding it', () => {
		const item = noteGapItem(chartres, notes, glossary, () => 0);

		expect(item?.term.name).toBe('tympanon');
		expect(item?.segments).toEqual([
			{ text: 'W ', masked: false },
			{ text: 'tympanonie', masked: true },
			{ text: ' Chrystus w mandorli. ', masked: false },
			{ text: 'Tympanon', masked: true },
			{ text: ' otacza archiwolta.', masked: false }
		]);
	});

	it('offers the term and three other names, the same category first', () => {
		const item = noteGapItem(chartres, notes, glossary, () => 0);
		const labels = item?.quiz.options.map((option) => option.label) ?? [];

		expect(item && labels[item.quiz.answer]).toBe('tympanon');
		expect(labels).toHaveLength(4);
		expect(labels).not.toContain('sfumato');
	});

	it('asks nothing without a term or without enough names to choose from', () => {
		expect(noteGapItem(chartres, 'Bez pojęć.', glossary)).toBeUndefined();
		expect(noteGapItem(chartres, notes, glossary.slice(0, 3))).toBeUndefined();
	});
});

describe('drawNoteGap', () => {
	const artworks = new Map([[chartres.id, chartres]]);

	it('asks the database for an artwork the session does not show', async () => {
		vi.mocked(loadNoteGap).mockResolvedValue([{ id: chartres.id, notes }]);
		const shown = [testArtwork(2, 'Shown')];

		const gaps = await drawNoteGap(true, { kind: 'all' }, shown, artworks, glossary);

		expect(loadNoteGap).toHaveBeenCalledWith({ kind: 'all' }, [shown[0].id]);
		expect(gaps.map((gap) => gap.artwork)).toEqual([chartres]);
	});

	it('takes the next candidate when the note of the first one has no gap', async () => {
		vi.mocked(loadNoteGap).mockResolvedValue([
			{ id: chartres.id, notes: '# Tympanon\n\nBez pojęć.' },
			{ id: chartres.id, notes }
		]);

		const gaps = await drawNoteGap(true, { kind: 'all' }, [], artworks, glossary);

		expect(gaps.map((gap) => gap.artwork)).toEqual([chartres]);
	});

	it('asks nothing while the switch is off or the database finds no note', async () => {
		vi.mocked(loadNoteGap).mockClear().mockResolvedValue([]);

		expect(await drawNoteGap(false, { kind: 'all' }, [], artworks, glossary)).toEqual([]);
		expect(loadNoteGap).not.toHaveBeenCalled();
		expect(await drawNoteGap(true, { kind: 'all' }, [], artworks, glossary)).toEqual([]);
	});
});
