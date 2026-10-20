import { availableSteps, stepSpan } from './scale.ts';
import { overlaps, spanOfYears, timeOf, type Era, type TimeSpan } from './time.ts';
import type { TimelineEvent } from './types.ts';

export type EventShape = 'ribbon' | 'pin';

export type LaidEvent = {
	event: TimelineEvent;
	start: number;
	end: number;
	cutBefore: boolean;
	cutAfter: boolean;
	shape: EventShape;
	inside: boolean;
	lane: number;
};

export const EVENT_LANES = 4;
export const EVENT_LANES_NARROW = 3;

const PIN_BELOW = 28;
const PIN_ROOM = 24;
const LABEL_PADDING = 16;
const AFTER_RIBBON = 22;
const GAP = 8;

export function eventsIn(events: readonly TimelineEvent[], span: TimeSpan): TimelineEvent[] {
	return events.filter((event) => overlaps(spanOfYears(event.yearFrom, event.yearTo), span));
}

export function layEvents(
	events: readonly TimelineEvent[],
	era: Era,
	perYear: number,
	labelWidth: (event: TimelineEvent) => number
): LaidEvent[] {
	const ends: number[] = [];
	return eventsIn(events, era)
		.map((event) => {
			const span = spanOfYears(event.yearFrom, event.yearTo);
			const start = Math.max(span.start, era.start);
			const end = Math.min(span.end, era.end);
			const from = start * perYear;
			const to = end * perYear;
			const label = labelWidth(event);
			const shape: EventShape = event.yearFrom === null || to - from < PIN_BELOW ? 'pin' : 'ribbon';
			const inside = shape === 'ribbon' && to - from >= label + LABEL_PADDING;
			const middle = (from + to) / 2;
			const reach =
				shape === 'pin'
					? { from: middle - GAP, to: middle + PIN_ROOM + label }
					: { from, to: inside ? to + GAP : to + AFTER_RIBBON + label };
			return {
				laid: {
					event,
					start,
					end,
					cutBefore: span.start < era.start,
					cutAfter: span.end > era.end,
					shape,
					inside,
					lane: 0
				},
				reach
			};
		})
		.sort((a, b) => a.reach.from - b.reach.from || a.laid.event.id.localeCompare(b.laid.event.id))
		.map(({ laid, reach }) => {
			let lane = ends.findIndex((end) => end <= reach.from);
			if (lane < 0) {
				lane = ends.length;
				ends.push(0);
			}
			ends[lane] = reach.to;
			return { ...laid, lane };
		});
}

export function lanesForEra(
	events: readonly TimelineEvent[],
	era: Era,
	width: number,
	labelWidth: (event: TimelineEvent) => number,
	cap: number
): number {
	let lanes = 1;
	for (const step of availableSteps(era)) {
		const laid = layEvents(events, era, width / stepSpan(step, era), labelWidth);
		lanes = Math.max(lanes, ...laid.map((event) => event.lane + 1));
	}
	return Math.min(lanes, cap);
}

export function yearsLong(event: TimelineEvent): number {
	return event.yearFrom === null ? 0 : timeOf(event.yearTo) - timeOf(event.yearFrom);
}
