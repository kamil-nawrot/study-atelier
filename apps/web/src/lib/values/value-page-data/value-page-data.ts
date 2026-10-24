import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { m } from '#lib/i18n/index.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import { loadNoteLinks, noteLinksFrom } from '#lib/notes/note-link-data/note-link-data.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import { loadValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { findSubject, isValueKind, subjectPath } from '#lib/card-index/value-pages/value-pages.ts';
import type { GlossaryEntry } from '#lib/glossary/types.ts';
import type { NoteLinks } from '@study-atelier/ui';
import type { Mention } from '#lib/notes/mentions-data/mentions-data.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';

type ValuePageResult = {
	subject?: ValueSubject;
	index: CardIndexData;
	artworks: WallArtwork[];
	details: ValueDetails;
	noteLinks?: NoteLinks;
	glossary?: GlossaryEntry[];
	mentions?: Mention[];
	notFound?: boolean;
	error?: string;
};

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
