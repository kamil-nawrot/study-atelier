type PlacedEvent = {
	from: number;
	to: number;
	pin: boolean;
	inside: boolean;
	name: number;
};

type Bounds = { start: number; end: number };

export type NamePlace = { before: boolean; shift: number };

export const PIN_NAME_GAP = 16;

export function namePlace(shown: PlacedEvent, bounds: Bounds): NamePlace {
	if (shown.pin) {
		const at = (shown.from + shown.to) / 2;
		const after = at + PIN_NAME_GAP + shown.name > bounds.end;
		return { before: after && at - PIN_NAME_GAP - shown.name >= bounds.start, shift: 0 };
	}
	if (!shown.inside) {
		const after = shown.to + shown.name > bounds.end;
		return { before: after && shown.from - shown.name >= bounds.start, shift: 0 };
	}
	const room = Math.max(0, shown.to - shown.from - shown.name);
	return { before: false, shift: Math.min(Math.max(bounds.start - shown.from, 0), room) };
}
