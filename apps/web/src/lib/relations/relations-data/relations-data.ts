import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import {
	artworkYears,
	eventsWindow,
	relatedGroups,
	typeCounts
} from '#lib/relations/relations/relations.ts';
import type { AuthorRelation } from '#lib/author-relations/types/author-relation.ts';
import type { RelatedEvent } from '#lib/relations/types/related-event.ts';
import type { Relations } from '#lib/relations/types/relations.ts';
import type { RelationsKind } from '#lib/relations/types/relations-kind.ts';
import type { YearSpan } from '#lib/relations/types/year-span.ts';

export type RelationsInput = {
	kind: RelationsKind;
	artworks: readonly WallArtwork[];
	index: CardIndexData;
	bounds?: YearSpan;
	eventId?: string;
	authors?: AuthorRelation[];
};

export async function loadEventsDuring(
	span: YearSpan,
	exceptId?: string
): Promise<RelatedEvent[] | undefined> {
	let query = supabase
		.from('timeline_events')
		.select('id, name, year_from, year_to, year_approximate')
		.gte('year_to', span.from)
		.or(`year_from.lte.${span.to},and(year_from.is.null,year_to.lte.${span.to})`)
		.order('year_to')
		.order('id');
	if (exceptId) query = query.neq('id', exceptId);
	const { data, error } = await query;
	if (error || !data) return undefined;
	return data.map((row) => ({
		id: row.id,
		name: row.name,
		yearFrom: row.year_from,
		yearTo: row.year_to,
		yearApproximate: row.year_approximate
	}));
}

export async function loadMasteredCount(
	artworkIds: readonly string[]
): Promise<number | undefined> {
	if (artworkIds.length === 0) return 0;
	const { data, error } = await supabase.rpc('mastered_artworks', { artwork_ids: [...artworkIds] });
	return error ? undefined : (data ?? 0);
}

export async function loadRelations(input: RelationsInput): Promise<Relations> {
	const years = artworkYears(input.artworks);
	const window = eventsWindow(input.kind, input.bounds, years);
	const [events, mastered] = await Promise.all([
		window ? loadEventsDuring(window, input.eventId) : Promise.resolve(undefined),
		loadMasteredCount(input.artworks.map((artwork) => artwork.id))
	]);
	return {
		kind: input.kind,
		bounds: input.bounds,
		years,
		groups: relatedGroups(input.kind, input.artworks, input.index),
		types: typeCounts(input.artworks),
		total: input.artworks.length,
		mastered,
		events,
		authors: input.authors
	};
}
