import Building2 from '@lucide/svelte/icons/building-2';
import Frame from '@lucide/svelte/icons/frame';
import House from '@lucide/svelte/icons/house';
import MapPin from '@lucide/svelte/icons/map-pin';
import Ticket from '@lucide/svelte/icons/ticket';
import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';
import type { PlaceType } from '#lib/catalogue/types/place-type.ts';

export const PLACE_TYPES: readonly PlaceType[] = [
	'museum',
	'gallery',
	'private_collection',
	'on_site',
	'city'
];

const PLACE_ICONS = {
	museum: Ticket,
	gallery: Frame,
	private_collection: House,
	on_site: MapPin,
	city: Building2
};

export function isPlaceType(value: unknown): value is PlaceType {
	return (PLACE_TYPES as readonly unknown[]).includes(value);
}

export function placeTypeIcon(type: PlaceType): typeof Ticket {
	return PLACE_ICONS[type];
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
