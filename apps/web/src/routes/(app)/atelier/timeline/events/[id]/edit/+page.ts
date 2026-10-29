import { loadTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => loadTimelineEvent(params.id);
