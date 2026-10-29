import { loadPlaceVisits } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import { loadNoteLinks, noteLinksFrom } from '#lib/notes/note-link-data/note-link-data.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import { loadValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { findSubject, isValueKind, subjectPath } from '#lib/card-index/value-pages/value-pages.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { NoteLinks } from '@study-atelier/ui';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { Mention } from '#lib/notes/types/mention.ts';
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
	visits?: Visit[];
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

async function loadPageExtras(
	subject: ValueSubject,
	index: CardIndexData,
	withArtworks: boolean
): Promise<{ mentions?: Mention[]; visits?: Visit[]; error?: string }> {
	if (!withArtworks) return {};
	const [mentions, places] = await Promise.all([
		loadMentions(subjectPath(subject), index),
		subject.kind === 'location' ? loadPlaceVisits(subject.record.id) : Promise.resolve(undefined)
	]);
	return { mentions, visits: places?.visits, error: places?.error };
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

	const [{ details, error }, extras] = await Promise.all([
		loadValueDetails(subject),
		loadPageExtras(subject, cardIndex.index, withArtworks)
	]);
	const detailsError = error ?? extras.error;
	if (detailsError) return failed(detailsError);

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
		mentions: extras.mentions,
		visits: extras.visits
	};
}

export async function loadNewValuePage(kind: string): Promise<ValuePageResult> {
	if (!isValueKind(kind) || kind === 'era') return failed(m.valuePage.notFound, true);
	const [cardIndex, noteLinks] = await Promise.all([loadCardIndex(), loadNoteLinks()]);
	if (cardIndex.error) return failed(cardIndex.error);
	return {
		subject: { kind, record: { id: '', category: kind, name: '', count: 0 } },
		index: cardIndex.index,
		artworks: [],
		details: emptyValueDetails(),
		noteLinks
	};
}
