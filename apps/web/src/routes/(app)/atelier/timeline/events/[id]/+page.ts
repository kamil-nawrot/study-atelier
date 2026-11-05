import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import { artworksOfEvent, type EventPageData } from '#lib/timeline/event-page/event-page.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<EventPageData> => {
	const [loaded, atelier] = await Promise.all([loadTimelineEvent(params.id), loadAtelier()]);
	if (loaded.notFound) return { artworks: [], notFound: true };
	const error = loaded.error ?? atelier.error;
	if (error || !loaded.event) return { artworks: [], error };
	return { event: loaded.event, artworks: artworksOfEvent(atelier.artworks, loaded.event) };
};
