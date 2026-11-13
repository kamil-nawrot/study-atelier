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
import { eraYears } from '#lib/catalogue/eras/eras.ts';
import { loadRelations } from '#lib/relations/relations-data/relations-data.ts';
import { loadSymbolUses } from '#lib/symbols/symbol-uses-data/symbol-uses-data.ts';
import type { SymbolUse } from '#lib/symbols/types/symbol-use.ts';
import type { Relations } from '#lib/relations/types/relations.ts';
import type { YearSpan } from '#lib/relations/types/year-span.ts';
import {
	artworksOfValue,
	findSubject,
	isValueKind,
	routeSubject,
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
	relations?: Relations;
	symbolUses?: SymbolUse[];
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

function subjectBounds(subject: ValueSubject, details: ValueDetails): YearSpan | undefined {
	if (subject.kind === 'era') {
		const [from, to] = eraYears(subject.code);
		return { from, to };
	}
	const author = details.author;
	if (!author || author.birthYear === null || author.deathYear === null) return undefined;
	return { from: author.birthYear, to: author.deathYear };
}

type LoadedDetails = Awaited<ReturnType<typeof loadValueDetails>>;
type NoteExtras = {
	noteLinks?: NoteLinks;
	glossary?: Awaited<ReturnType<typeof loadTermIndex>>;
};

async function withNoteExtras(
	loaded: LoadedDetails,
	route: ValueSubject,
	withArtworks: boolean
): Promise<LoadedDetails & NoteExtras> {
	const target = mentionsLinks(loaded.details.notes) ? valueLinkTarget(route) : undefined;
	const [glossary, noteLinks] = await Promise.all([
		withArtworks && loaded.details.notes ? loadTermIndex() : undefined,
		withArtworks ? target && loadNoteLinkLabels(target) : loadEditorNoteLinks(target)
	]);
	return { ...loaded, noteLinks, glossary };
}

export async function loadValuePage(
	kind: string,
	id: string,
	withArtworks: boolean
): Promise<ValuePageResult> {
	if (!isValueKind(kind)) return failed(m.valuePage.notFound, true);

	const route = routeSubject(kind, id);
	if (!route) return failed(m.valuePage.notFound, true);

	const [cardIndex, { details, error, noteLinks, glossary }, extras, own] = await Promise.all([
		loadCardIndex(),
		loadValueDetails(route).then((loaded) => withNoteExtras(loaded, route, withArtworks)),
		loadPageExtras(route, withArtworks),
		withArtworks ? loadArtworksOfValue(valueFilter(route)) : Promise.resolve({ artworks: [] })
	]);
	if (cardIndex.error) return failed(cardIndex.error);
	const subject = findSubject(cardIndex.index, kind, id);
	if (!subject) return failed(m.valuePage.notFound, true);

	const loadError = error ?? ('error' in own ? own.error : undefined);
	if (loadError) return failed(loadError);

	const [relations, uses] = withArtworks
		? await Promise.all([
				loadRelations({
					kind: subject.kind,
					artworks: artworksOfValue(own.artworks, subject),
					index: cardIndex.index,
					bounds: subjectBounds(subject, details),
					authors: details.author?.relations
				}),
				loadSymbolUses(
					subject.kind === 'era' ? { eraCode: subject.code } : { valueId: subjectId(subject) }
				)
			])
		: [undefined, undefined];

	return {
		subject,
		index: cardIndex.index,
		artworks: own.artworks,
		details,
		noteLinks,
		glossary: glossary?.terms,
		mentions: extras.mentions,
		visits: extras.visits,
		relations,
		symbolUses: uses?.error ? undefined : uses?.uses
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
