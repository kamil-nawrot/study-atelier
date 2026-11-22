import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadGlossaryEntry, loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryFormResult } from '#lib/glossary/types/glossary-form-result.ts';
import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';

export function requestedKind(value: string | null): GlossaryKind {
	return value === 'figure' ? 'figure' : 'term';
}

export async function loadGlossaryForm(
	id?: string,
	requested: GlossaryKind = 'term'
): Promise<GlossaryFormResult> {
	const [glossary, found, cardIndex] = await Promise.all([
		loadTermIndex(),
		id ? loadGlossaryEntry(id) : undefined,
		loadCardIndex()
	]);
	const error = glossary.error ?? found?.error ?? cardIndex.error;
	if (error) return { entries: [], index: emptyCardIndex(), kind: requested, error };
	if (found && !found.entry) {
		return { entries: glossary.terms, index: cardIndex.index, kind: requested, notFound: true };
	}
	const kind = found?.entry?.kind ?? requested;
	return { entry: found?.entry, entries: glossary.terms, index: cardIndex.index, kind };
}
