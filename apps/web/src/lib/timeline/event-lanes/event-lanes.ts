import { availableSteps, stepSpan } from '#lib/timeline/scale/scale.ts';
import { overlaps, spanOfYears, timeOf } from '#lib/timeline/time/time.ts';
import type { Era } from '#lib/timeline/types/era.ts';
import type { TimeSpan } from '#lib/timeline/types/time-span.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { EventShape } from '#lib/timeline/types/event-shape.ts';
import type { LaidEvent } from '#lib/timeline/types/laid-event.ts';

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
	labelWidth: (event: TimelineEvent) => number,
	lanes = Infinity
): LaidEvent[] {
	const ends: number[] = Number.isFinite(lanes)
		? Array.from({ length: lanes }, () => -Infinity)
		: [];
	const shapeEnds = ends.map(() => -Infinity);
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
			const shapeReach =
				shape === 'pin' ? { from: middle - GAP, to: middle + GAP } : { from, to: to + GAP };
			return {
				shapeReach,
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
		.sort(
			(a, b) =>
				a.shapeReach.from - b.shapeReach.from || a.laid.event.id.localeCompare(b.laid.event.id)
		)
		.map(({ laid, reach, shapeReach }) => {
			if (Number.isFinite(lanes)) {
				const lane = roomiestLane(ends, shapeEnds, shapeReach.from);
				if (lane < 0) return { ...laid, lane: lanes };
				ends[lane] = Math.max(ends[lane], reach.to);
				shapeEnds[lane] = shapeReach.to;
				return { ...laid, lane };
			}
			let lane = ends.findIndex((end) => end <= reach.from);
			if (lane < 0) {
				lane = ends.length;
				ends.push(0);
			}
			ends[lane] = reach.to;
			return { ...laid, lane };
		});
}

function roomiestLane(ends: readonly number[], shapeEnds: readonly number[], from: number): number {
	let best = -1;
	shapeEnds.forEach((shapeEnd, lane) => {
		if (shapeEnd <= from && (best < 0 || ends[lane] < ends[best])) best = lane;
	});
	return best;
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
