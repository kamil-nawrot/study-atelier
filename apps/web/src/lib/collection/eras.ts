import Church from '@lucide/svelte/icons/church';
import Compass from '@lucide/svelte/icons/compass';
import Flame from '@lucide/svelte/icons/flame';
import Landmark from '@lucide/svelte/icons/landmark';
import Smartphone from '@lucide/svelte/icons/smartphone';
import TrainFront from '@lucide/svelte/icons/train-front';
import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/index.ts';
import type { EraCode } from './types.ts';

export const ERA_CODES: readonly EraCode[] = [
	'prehistory',
	'antiquity',
	'middle_ages',
	'early_modern',
	'modern',
	'contemporary'
];

const ERA_ICONS: Record<EraCode, ChoiceTile['icon']> = {
	prehistory: Flame,
	antiquity: Landmark,
	middle_ages: Church,
	early_modern: Compass,
	modern: TrainFront,
	contemporary: Smartphone
};

export function isEraCode(value: unknown): value is EraCode {
	return ERA_CODES.includes(value as EraCode);
}

export function eraName(code: EraCode): string {
	return m.eras[code].name;
}

export function eraTiles(): ChoiceTile[] {
	return ERA_CODES.map((code) => ({
		value: code,
		label: m.eras[code].name,
		note: m.eras[code].years,
		icon: ERA_ICONS[code]
	}));
}
