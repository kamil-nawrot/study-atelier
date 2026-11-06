import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadRelations } from '#lib/relations/relations-data/relations-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import { artworksOfEvent, type EventPageData } from '#lib/timeline/event-page/event-page.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<EventPageData> => {
	const [loaded, atelier, cardIndex] = await Promise.all([
		loadTimelineEvent(params.id),
		loadAtelier(),
		loadCardIndex()
	]);
	if (loaded.notFound) return { artworks: [], notFound: true };
	const error = loaded.error ?? atelier.error ?? cardIndex.error;
	if (error || !loaded.event) return { artworks: [], error };
	const event = loaded.event;
	const artworks = artworksOfEvent(atelier.artworks, event);
	const relations = await loadRelations({
		kind: 'event',
		artworks,
		index: cardIndex.index,
		bounds: { from: event.yearFrom ?? event.yearTo, to: event.yearTo },
		eventId: event.id
	});
	return { event, artworks, relations };
};
