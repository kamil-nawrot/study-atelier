import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';
import type { FlagChoicePin } from '#lib/backroom/types/flag-choice-pin.ts';
import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
import type { FlagItem } from '#lib/backroom/types/flag-item.ts';

export function groupLabel(item: FlagItem): string {
	if (item.kind === 'artwork') return m.backroom.groups.artwork(item.title);
	return item.kind === 'term'
		? m.backroom.groups.term(item.name)
		: m.backroom.groups.symbol(item.name);
}

export function groupTiles(group: FlagGroup): ChoiceTile[] {
	return group.reasons.map((reason) => ({ value: reason, label: m.backroom.reasons[reason] }));
}

export function pinTiles(pins: readonly FlagChoicePin[]): ChoiceTile[] {
	return pins.map((pin) => ({ value: pin.id, label: m.pins.marker(pin.number, pin.name) }));
}
