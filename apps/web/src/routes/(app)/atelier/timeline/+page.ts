import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { timelineIsEmpty } from '#lib/timeline/filter/filter.ts';
import { loadTimelineEvents } from '#lib/timeline/timeline-data/timeline-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [atelier, timeline] = await Promise.all([loadAtelier(), loadTimelineEvents()]);
	return {
		artworks: atelier.artworks,
		events: timeline.events,
		empty: timelineIsEmpty(atelier.artworks, timeline.events.length),
		error: atelier.error ?? timeline.error
	};
};
