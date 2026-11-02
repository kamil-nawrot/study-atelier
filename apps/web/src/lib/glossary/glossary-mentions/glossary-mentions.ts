import { mentionsTerm } from '@study-atelier/ui';
import { loadTermMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import type { Mention } from '#lib/notes/types/mention.ts';
import { noteTermsOf } from '#lib/glossary/note-terms/note-terms.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';

export async function loadGlossaryMentions(entry: GlossaryEntry): Promise<Mention[]> {
	const [term] = noteTermsOf([entry]);
	return loadTermMentions(term.phrases, (notes) => mentionsTerm(notes, term));
}
