import type { EraCode } from '#lib/catalogue/types/era-code.ts';

type Dated = {
	eraCode: EraCode | null;
	yearFrom: number | null;
	yearTo: number | null;
};

const ERA_SPANS: Record<EraCode, [number, number]> = {
	prehistory: [-Infinity, -3000],
	antiquity: [-3000, 476],
	middle_ages: [476, 1492],
	early_modern: [1492, 1789],
	modern: [1789, 1945],
	contemporary: [1945, Infinity]
};

export function yearOutsideEra({ eraCode, yearFrom, yearTo }: Dated): boolean {
	if (eraCode === null || yearTo === null) return false;
	const [start, end] = ERA_SPANS[eraCode];
	return yearTo < start || (yearFrom ?? yearTo) > end;
}
