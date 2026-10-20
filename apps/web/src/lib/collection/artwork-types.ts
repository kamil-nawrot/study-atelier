import type { LucideIcon } from '@lucide/svelte';
import Amphora from '@lucide/svelte/icons/amphora';
import Camera from '@lucide/svelte/icons/camera';
import Castle from '@lucide/svelte/icons/castle';
import Hammer from '@lucide/svelte/icons/hammer';
import Palette from '@lucide/svelte/icons/palette';
import PenTool from '@lucide/svelte/icons/pen-tool';
import Shapes from '@lucide/svelte/icons/shapes';
import Stamp from '@lucide/svelte/icons/stamp';
import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/index.ts';
import type { ArtworkTypeCode } from './types.ts';

export const ARTWORK_TYPE_CODES: readonly ArtworkTypeCode[] = [
	'architecture',
	'painting',
	'sculpture',
	'drawing',
	'printmaking',
	'applied_arts',
	'photography',
	'other'
];

const ARTWORK_TYPE_ICONS: Record<ArtworkTypeCode, LucideIcon> = {
	architecture: Castle,
	painting: Palette,
	sculpture: Hammer,
	drawing: PenTool,
	printmaking: Stamp,
	applied_arts: Amphora,
	photography: Camera,
	other: Shapes
};

export function isArtworkTypeCode(value: unknown): value is ArtworkTypeCode {
	return ARTWORK_TYPE_CODES.includes(value as ArtworkTypeCode);
}

export function artworkTypeIcon(code: ArtworkTypeCode): LucideIcon {
	return ARTWORK_TYPE_ICONS[code];
}

export function artworkTypeTiles(): ChoiceTile[] {
	return ARTWORK_TYPE_CODES.map((code) => ({
		value: code,
		label: m.artworkTypes[code],
		icon: ARTWORK_TYPE_ICONS[code]
	}));
}
