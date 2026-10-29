type ShownEvent = { from: number; to: number; inside: boolean };

export function nameTooltipAlign(
	shown: ShownEvent,
	length: number,
	vertical: boolean
): 'start' | 'end' {
	const nameAt = shown.inside ? shown.from : shown.to;
	return !vertical && nameAt > length / 2 ? 'end' : 'start';
}
