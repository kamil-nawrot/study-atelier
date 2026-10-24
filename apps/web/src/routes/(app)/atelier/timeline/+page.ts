import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadTimelineEvents } from '#lib/timeline/timeline-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [atelier, timeline] = await Promise.all([loadAtelier(), loadTimelineEvents()]);
	return {
		artworks: atelier.artworks,
		events: timeline.events,
		error: atelier.error ?? timeline.error
	};
};
