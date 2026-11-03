import { loadPlaceVisits } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { loadArtworksOfValue } from '#lib/wall/wall-data/wall-data.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import {
	loadEditorNoteLinks,
	loadNoteLinkLabels,
	mentionsLinks
} from '#lib/notes/note-link-data/note-link-data.ts';
import { valueLinkTarget } from '#lib/notes/note-link-target/note-link-target.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import { loadValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import {
	findSubject,
	isValueKind,
	subjectId,
	subjectPath
} from '#lib/card-index/value-pages/value-pages.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
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
	glossary?: GlossaryTerm[];
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

function valueFilter(subject: ValueSubject): { eraCode: string } | { valueId: string } {
	return subject.kind === 'era' ? { eraCode: subject.code } : { valueId: subjectId(subject) };
}

async function loadPageExtras(
	subject: ValueSubject,
	withArtworks: boolean
): Promise<{ mentions?: Mention[]; visits?: Visit[] }> {
	if (!withArtworks) return {};
	const [mentions, places] = await Promise.all([
		loadMentions(valueLinkTarget(subject), subjectPath(subject)),
		subject.kind === 'location' ? loadPlaceVisits(subject.record.id) : Promise.resolve(undefined)
	]);
	return { mentions, visits: places?.error ? undefined : places?.visits };
}

export async function loadValuePage(
	kind: string,
	id: string,
	withArtworks: boolean
): Promise<ValuePageResult> {
	if (!isValueKind(kind)) return failed(m.valuePage.notFound, true);

	const cardIndex = await loadCardIndex();
	if (cardIndex.error) return failed(cardIndex.error);

	const subject = findSubject(cardIndex.index, kind, id);
	if (!subject) return failed(m.valuePage.notFound, true);

	const [{ details, error }, extras, own] = await Promise.all([
		loadValueDetails(subject),
		loadPageExtras(subject, withArtworks),
		withArtworks ? loadArtworksOfValue(valueFilter(subject)) : Promise.resolve({ artworks: [] })
	]);
	const loadError = error ?? ('error' in own ? own.error : undefined);
	if (loadError) return failed(loadError);

	const target = mentionsLinks(details.notes) ? valueLinkTarget(subject) : undefined;
	const [glossary, noteLinks] = await Promise.all([
		withArtworks && details.notes ? loadTermIndex() : undefined,
		withArtworks ? target && loadNoteLinkLabels(target) : loadEditorNoteLinks(target)
	]);
	return {
		subject,
		index: cardIndex.index,
		artworks: own.artworks,
		details,
		noteLinks,
		glossary: glossary?.terms,
		mentions: extras.mentions,
		visits: extras.visits
	};
}

export async function loadNewValuePage(kind: string): Promise<ValuePageResult> {
	if (!isValueKind(kind) || kind === 'era') return failed(m.valuePage.notFound, true);
	const [cardIndex, noteLinks] = await Promise.all([loadCardIndex(), loadEditorNoteLinks()]);
	if (cardIndex.error) return failed(cardIndex.error);
	return {
		subject: { kind, record: { id: '', category: kind, name: '', count: 0 } },
		index: cardIndex.index,
		artworks: [],
		details: emptyValueDetails(),
		noteLinks
	};
}
