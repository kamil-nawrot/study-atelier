import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

export const READING_TITLES = 3;

export function readingText(
	year: number,
	events: readonly TimelineEvent[],
	artworks: readonly WallArtwork[]
): string {
	if (events.length === 0 && artworks.length === 0) return '';
	const parts =
		events.length > 0 ? [m.timeline.nowEvents(events.map((event) => event.name).join(', '))] : [];
	if (artworks.length > 0) {
		parts.push(
			m.timeline.nowArtworks(
				artworks
					.slice(0, READING_TITLES)
					.map((artwork) => artwork.title)
					.join(', '),
				artworks.length - READING_TITLES
			)
		);
	}
	return m.timeline.now(m.atelier.year(year, false), parts);
}
