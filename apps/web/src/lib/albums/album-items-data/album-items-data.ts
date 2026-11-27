import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadGlossaryEntry, loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadTimelineEventsByName } from '#lib/timeline/timeline-data/timeline-data.ts';
import { loadValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { sameName } from '#lib/albums/album-values/album-values.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { ItemMatches } from '#lib/albums/types/item-matches.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';

type ItemData = {
	matches: ItemMatches;
	entries: GlossaryTerm[];
	index: CardIndexData;
	error?: string;
};

function failed(error: string): ItemData {
	return {
		matches: { entries: [], events: [], records: [], details: {} },
		entries: [],
		index: emptyCardIndex(),
		error
	};
}

async function matchedEntries(album: Album, terms: GlossaryTerm[]): Promise<GlossaryEntry[]> {
	const ids = terms
		.filter((term) =>
			album.terms.some((candidate) =>
				[candidate.name, ...candidate.alternativeNames].some((name) => sameName(term.name, name))
			)
		)
		.map((term) => term.id);
	const loaded = await Promise.all(ids.map((id) => loadGlossaryEntry(id)));
	return loaded.flatMap((result) => (result.entry ? [result.entry] : []));
}

function matchedRecords(album: Album, index: CardIndexData): CardIndexRecord[] {
	return index.values.filter((record) =>
		album.values.some(
			(value) =>
				value.category === record.category &&
				[value.name, ...value.alternativeNames].some((name) => sameName(record.name, name))
		)
	);
}

async function detailsOf(
	records: CardIndexRecord[]
): Promise<{ details: Record<string, ValueDetails>; error?: string }> {
	const loaded = await Promise.all(
		records.map(async (record) => ({
			id: record.id,
			result: await loadValueDetails({ kind: record.category, record })
		}))
	);
	const error = loaded.find((entry) => entry.result.error)?.result.error;
	return {
		details: Object.fromEntries(loaded.map((entry) => [entry.id, entry.result.details])),
		error
	};
}

export async function loadItemData(album: Album): Promise<ItemData> {
	const [glossary, cardIndex, events] = await Promise.all([
		loadTermIndex(),
		loadCardIndex(),
		loadTimelineEventsByName(album.events.map((event) => event.name))
	]);
	const error = glossary.error ?? cardIndex.error ?? events.error;
	if (error) return failed(error);
	const records = matchedRecords(album, cardIndex.index);
	const [entries, details] = await Promise.all([
		matchedEntries(album, glossary.terms),
		detailsOf(records)
	]);
	if (details.error) return failed(details.error);
	return {
		matches: { entries, events: events.events, records, details: details.details },
		entries: glossary.terms,
		index: cardIndex.index,
		error: undefined
	};
}
