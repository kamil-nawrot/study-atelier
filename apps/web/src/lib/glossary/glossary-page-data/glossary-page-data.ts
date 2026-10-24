import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryFormResult } from '#lib/glossary/types/glossary-form-result.ts';

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
