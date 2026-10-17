import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { m } from '#lib/i18n/index.ts';
import { loadAtelier } from './artworks.ts';
import { loadCardIndex } from './card-index-data.ts';
import { emptyCardIndex } from './card-index.ts';
import { loadMentions } from './mentions.ts';
import { loadNoteLinks, noteLinksFrom } from './note-link-data.ts';
import { emptyValueDetails, loadValueDetails } from './value-details.ts';
import { findSubject, isValueKind, subjectPath } from './value-pages.ts';
import type { ValuePageResult } from './types.ts';

function failed(error: string, notFound = false): ValuePageResult {
	return {
		index: emptyCardIndex(),
		artworks: [],
		details: emptyValueDetails(),
		error,
		notFound
	};
}

export async function loadValuePage(
	kind: string,
	id: string,
	withArtworks: boolean
): Promise<ValuePageResult> {
	if (!isValueKind(kind)) return failed(m.valuePage.notFound, true);

	const [cardIndex, atelier, editorLinks] = await Promise.all([
		loadCardIndex(),
		withArtworks ? loadAtelier() : Promise.resolve({ artworks: [] }),
		withArtworks ? Promise.resolve(undefined) : loadNoteLinks()
	]);
	const loadError = cardIndex.error ?? ('error' in atelier ? atelier.error : undefined);
	if (loadError) return failed(loadError);

	const subject = findSubject(cardIndex.index, kind, id);
	if (!subject) return failed(m.valuePage.notFound, true);

	const [{ details, error }, mentions] = await Promise.all([
		loadValueDetails(subject),
		withArtworks ? loadMentions(subjectPath(subject), cardIndex.index) : Promise.resolve(undefined)
	]);
	if (error) return failed(error);

	const glossary = withArtworks && details.notes ? (await loadGlossary()).entries : undefined;
	const noteLinks =
		editorLinks ?? (withArtworks ? noteLinksFrom(cardIndex.index, atelier.artworks) : undefined);
	return {
		subject,
		index: cardIndex.index,
		artworks: atelier.artworks,
		details,
		noteLinks,
		glossary,
		mentions
	};
}
