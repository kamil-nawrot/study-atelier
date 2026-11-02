import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadGlossaryEntry, loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryFormResult } from '#lib/glossary/types/glossary-form-result.ts';

export async function loadGlossaryForm(id?: string): Promise<GlossaryFormResult> {
	const [glossary, found, cardIndex] = await Promise.all([
		loadTermIndex(),
		id ? loadGlossaryEntry(id) : undefined,
		loadCardIndex()
	]);
	const error = glossary.error ?? found?.error ?? cardIndex.error;
	if (error) return { entries: [], index: emptyCardIndex(), error };
	if (found && !found.entry) {
		return { entries: glossary.terms, index: cardIndex.index, notFound: true };
	}
	return { entry: found?.entry, entries: glossary.terms, index: cardIndex.index };
}
