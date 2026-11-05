import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { artworksIn } from '#lib/timeline/filter/filter.ts';
import { spanOfYears } from '#lib/timeline/time/time.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { Relations } from '#lib/relations/types/relations.ts';

export type EventPageData = {
	event?: TimelineEvent;
	artworks: WallArtwork[];
	relations?: Relations;
	error?: string;
	notFound?: boolean;
};

export function eventPath(id: string): ResolvedPathname {
	return resolve('/(app)/atelier/timeline/events/[id]', { id });
}

export function eventEditPath(id: string): ResolvedPathname {
	return resolve('/(app)/atelier/timeline/events/[id]/edit', { id });
}

function chronologically(a: WallArtwork, b: WallArtwork): number {
	return (a.yearTo ?? 0) - (b.yearTo ?? 0) || a.number - b.number;
}

export function isSpan(event: Pick<TimelineEvent, 'yearFrom' | 'yearTo'>): boolean {
	return event.yearFrom !== null && event.yearFrom !== event.yearTo;
}

export function artworksOfEvent(
	artworks: readonly WallArtwork[],
	event: TimelineEvent
): WallArtwork[] {
	return artworksIn(artworks, spanOfYears(event.yearFrom, event.yearTo)).sort(chronologically);
}
