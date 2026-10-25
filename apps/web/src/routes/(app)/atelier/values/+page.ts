import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { withOwnValues } from '#lib/card-index/own-fields/own-fields.ts';
import { loadOwnFields } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { loadTimelineEvents } from '#lib/timeline/timeline-data/timeline-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [{ ownValues, ...cardIndex }, own, timeline] = await Promise.all([
		loadCardIndex(),
		loadOwnFields(),
		loadTimelineEvents()
	]);
	return {
		...cardIndex,
		error: cardIndex.error ?? timeline.error,
		events: timeline.events,
		ownFields: withOwnValues(own.fields, ownValues),
		ownFieldsError: own.error
	};
};
