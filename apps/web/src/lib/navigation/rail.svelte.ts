import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';

const RAIL_KEY = 'study-atelier:rail-expanded';

function rememberedExpanded(): boolean {
	return readStored('local', RAIL_KEY) === 'true';
}

let expanded = $state(rememberedExpanded());

export function railExpanded(): boolean {
	return expanded;
}

export function setRailExpanded(value: boolean): void {
	expanded = value;
	writeStored('local', RAIL_KEY, value ? 'true' : null);
}
