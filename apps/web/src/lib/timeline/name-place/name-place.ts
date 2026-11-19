type Bounds = { start: number; end: number };

type Span = { from: number; to: number };

export type NamedEvent = {
	id: string;
	lane: number;
	pin: boolean;
	from: number;
	to: number;
	name: number;
};

export type NameSide = 'inside' | 'after' | 'before' | 'none';

export type NamePlace = { side: NameSide; shift: number };

export const PIN_NAME_GAP = 16;

const RIBBON_OVERHANG = 4;
const PIN_HALF = 6;
const INSIDE_PADDING = 16;
const NAME_GAP = 8;

export function drawnRibbon(from: number, to: number, length: number): Bounds {
	return {
		start: Math.min(Math.max(from, -RIBBON_OVERHANG), to),
		end: Math.max(Math.min(to, length + RIBBON_OVERHANG), from)
	};
}

function shapeOf(shown: NamedEvent): Span {
	if (!shown.pin) return { from: shown.from, to: shown.to };
	const at = (shown.from + shown.to) / 2;
	return { from: at - PIN_HALF, to: at + PIN_HALF };
}

function nameSpans(shown: NamedEvent): { after: Span; before: Span } {
	if (shown.pin) {
		const at = (shown.from + shown.to) / 2;
		return {
			after: { from: at, to: at + PIN_NAME_GAP + shown.name },
			before: { from: at - PIN_NAME_GAP - shown.name, to: at }
		};
	}
	return {
		after: { from: shown.to, to: shown.to + shown.name },
		before: { from: shown.from - shown.name, to: shown.from }
	};
}

function free(span: Span, taken: readonly Span[], bounds: Bounds): boolean {
	return (
		span.from >= bounds.start &&
		span.to <= bounds.end &&
		taken.every((other) => other.to + NAME_GAP <= span.from || other.from >= span.to + NAME_GAP)
	);
}

function insideShift(shown: NamedEvent, bounds: Bounds): number {
	const room = Math.max(0, shown.to - shown.from - shown.name);
	return Math.min(Math.max(bounds.start - shown.from, 0), room);
}

function placeLane(
	lane: readonly NamedEvent[],
	bounds: Bounds,
	places: Map<string, NamePlace>
): void {
	const shapes = lane.map((shown) => ({ id: shown.id, span: shapeOf(shown) }));
	const names: Span[] = [];
	for (const shown of lane) {
		if (!shown.pin && shown.to - shown.from >= shown.name + INSIDE_PADDING) {
			places.set(shown.id, { side: 'inside', shift: insideShift(shown, bounds) });
			continue;
		}
		const taken = [
			...shapes.filter((shape) => shape.id !== shown.id).map((shape) => shape.span),
			...names
		];
		const { after, before } = nameSpans(shown);
		const side = free(after, taken, bounds)
			? 'after'
			: free(before, taken, bounds)
				? 'before'
				: 'none';
		if (side !== 'none') names.push(side === 'after' ? after : before);
		places.set(shown.id, { side, shift: 0 });
	}
}

export function placeNames(events: readonly NamedEvent[], bounds: Bounds): Map<string, NamePlace> {
	const places = new Map<string, NamePlace>();
	const lanes = new Map<number, NamedEvent[]>();
	for (const shown of [...events].sort((a, b) => a.from - b.from || a.id.localeCompare(b.id))) {
		lanes.set(shown.lane, [...(lanes.get(shown.lane) ?? []), shown]);
	}
	for (const lane of lanes.values()) placeLane(lane, bounds, places);
	return places;
}
