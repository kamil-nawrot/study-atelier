import { eraJunctions } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { ERA_CODES, eraYears } from '#lib/catalogue/eras/eras.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { EventItem } from '#lib/review/types/event-item.ts';
import type { RoundEvent } from '#lib/review/types/round-event.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import { yearOutcome, type Years } from '#lib/review/year-guess/year-guess.ts';

export function eraOfYear(year: number, junctions: readonly number[] = eraJunctions()): EraCode {
	return ERA_CODES[junctions.filter((junction) => junction <= year).length];
}

export function askedYear(item: Pick<EventItem, 'event' | 'kind'>): number {
	return item.kind === 'start' ? (item.event.yearFrom ?? item.event.yearTo) : item.event.yearTo;
}

export function eventBounds(year: number, today: Date): Years {
	const [start, end] = eraYears(eraOfYear(year), today);
	return [Math.min(start, year), Math.max(end, year)];
}

export function eventItems(
	picked: readonly RoundEvent[],
	events: readonly TimelineEvent[]
): EventItem[] {
	const byId = new Map(events.map((event) => [event.id, event]));
	return picked.flatMap(({ eventId, kind, card }) => {
		const event = byId.get(eventId);
		return event ? [{ mode: 'event_year' as const, kind, event, card }] : [];
	});
}

export function eventRating(
	item: Pick<EventItem, 'event' | 'kind'>,
	guess: number,
	today: Date
): ReviewRating {
	const asked = askedYear(item);
	return yearOutcome(guess, [asked, asked], eventBounds(asked, today)).rating;
}
