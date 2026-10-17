import { loadCardIndex } from '#lib/collection/card-index-data.ts';
import { emptyCardIndex } from '#lib/collection/card-index.ts';
import { loadGlossary } from './glossary-data.ts';
import type { GlossaryFormResult } from './types.ts';

export async function loadGlossaryForm(id?: string): Promise<GlossaryFormResult> {
	const [glossary, cardIndex] = await Promise.all([loadGlossary(), loadCardIndex()]);
	const error = glossary.error ?? cardIndex.error;
	if (error) return { entries: [], index: emptyCardIndex(), error };
	const entry = id ? glossary.entries.find((candidate) => candidate.id === id) : undefined;
	if (id && !entry) {
		return { entries: glossary.entries, index: cardIndex.index, notFound: true };
	}
	return { entry, entries: glossary.entries, index: cardIndex.index };
}
