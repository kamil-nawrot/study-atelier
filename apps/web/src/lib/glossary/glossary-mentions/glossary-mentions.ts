import { mentionsTerm } from '@study-atelier/ui';
import { loadNotesMentions, type Mention } from '#lib/notes/mentions-data/mentions-data.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import { noteTermsOf } from '#lib/glossary/note-terms/note-terms.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';

export async function loadGlossaryMentions(
	entry: GlossaryEntry,
	index?: CardIndexData
): Promise<Mention[]> {
	const [term] = noteTermsOf([entry]);
	const needles = term.phrases.map((phrase) => phrase.toLowerCase());
	return loadNotesMentions(
		{
			test: (notes) => {
				const lower = notes.toLowerCase();
				return needles.some((needle) => lower.includes(needle)) && mentionsTerm(notes, term);
			}
		},
		'',
		index
	);
}
