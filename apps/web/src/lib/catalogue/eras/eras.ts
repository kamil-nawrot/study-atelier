import type { LucideIcon } from '@lucide/svelte';
import Church from '@lucide/svelte/icons/church';
import Compass from '@lucide/svelte/icons/compass';
import Flame from '@lucide/svelte/icons/flame';
import Landmark from '@lucide/svelte/icons/landmark';
import Smartphone from '@lucide/svelte/icons/smartphone';
import TrainFront from '@lucide/svelte/icons/train-front';
import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import { eraJunctions, PREHISTORY_START } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';

export const ERA_CODES: readonly EraCode[] = [
	'prehistory',
	'antiquity',
	'middle_ages',
	'early_modern',
	'modern',
	'contemporary'
];

const ERA_ICONS: Record<EraCode, LucideIcon> = {
	prehistory: Flame,
	antiquity: Landmark,
	middle_ages: Church,
	early_modern: Compass,
	modern: TrainFront,
	contemporary: Smartphone
};

export function eraStartYear(code: EraCode, junctions: readonly number[] = eraJunctions()): number {
	const index = ERA_CODES.indexOf(code);
	return index === 0 ? PREHISTORY_START : junctions[index - 1];
}

export function eraEndYear(
	code: EraCode,
	junctions: readonly number[] = eraJunctions()
): number | undefined {
	const index = ERA_CODES.indexOf(code);
	return index < junctions.length ? junctions[index] : undefined;
}

export function eraYears(code: EraCode, today: Date = new Date()): [number, number] {
	return [eraStartYear(code), eraEndYear(code) ?? today.getFullYear()];
}

export function eraYearsText(code: EraCode, junctions: readonly number[] = eraJunctions()): string {
	const end = eraEndYear(code, junctions);
	const year = (value: number): string => m.atelier.year(value, false);
	if (code === 'prehistory' && end !== undefined) return m.eraYears.until(year(end));
	if (end === undefined) return m.eraYears.from(year(eraStartYear(code, junctions)));
	return m.atelier.yearRange(year(eraStartYear(code, junctions)), year(end));
}

export function yearOutsideEra(
	{
		eraCode,
		yearFrom,
		yearTo
	}: { eraCode: EraCode | null; yearFrom: number | null; yearTo: number | null },
	junctions: readonly number[] = eraJunctions()
): boolean {
	if (eraCode === null || yearTo === null) return false;
	const start = eraCode === 'prehistory' ? -Infinity : eraStartYear(eraCode, junctions);
	const end = eraEndYear(eraCode, junctions) ?? Infinity;
	return yearTo < start || (yearFrom ?? yearTo) > end;
}

export function isEraCode(value: unknown): value is EraCode {
	return ERA_CODES.includes(value as EraCode);
}

export function eraIcon(code: EraCode): LucideIcon {
	return ERA_ICONS[code];
}

export function eraName(code: EraCode): string {
	return m.eras[code].name;
}

export function eraTitle(code: EraCode): string {
	const name = eraName(code);
	return `${name.charAt(0).toLocaleUpperCase('pl')}${name.slice(1)}`;
}

export function eraTiles(): ChoiceTile[] {
	return ERA_CODES.map((code) => ({
		value: code,
		label: m.eras[code].name,
		note: eraYearsText(code),
		icon: ERA_ICONS[code]
	}));
}
