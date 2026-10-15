import House from '@lucide/svelte/icons/house';
import Landmark from '@lucide/svelte/icons/landmark';
import MapPin from '@lucide/svelte/icons/map-pin';
import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/index.ts';
import type { PlaceType } from './types.ts';

export const PLACE_TYPES: readonly PlaceType[] = ['museum', 'private_collection', 'on_site'];

const PLACE_ICONS = { museum: Landmark, private_collection: House, on_site: MapPin };

export function isPlaceType(value: unknown): value is PlaceType {
	return (PLACE_TYPES as readonly unknown[]).includes(value);
}

export function placeTypeName(type: PlaceType): string {
	return m.valueForm.placeTypes[type];
}

export function placeTiles(): ChoiceTile[] {
	return PLACE_TYPES.map((type) => ({
		value: type,
		label: placeTypeName(type),
		icon: PLACE_ICONS[type]
	}));
}
