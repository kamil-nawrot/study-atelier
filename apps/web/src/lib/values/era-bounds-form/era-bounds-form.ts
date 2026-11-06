import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import {
	ERA_CODES,
	eraEndYear,
	eraName,
	eraStartYear,
	yearOutsideEra
} from '#lib/catalogue/eras/eras.ts';
import { PREHISTORY_START } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import { m } from '#lib/i18n/i18n.ts';
import { emptyFilter } from '#lib/wall/filter/filter.ts';
import { filterToParams } from '#lib/wall/filter-params/filter-params.ts';
import type { EraBoundsErrors } from '#lib/values/types/era-bounds-errors.ts';
import type { EraBoundsFormState } from '#lib/values/types/era-bounds-form-state.ts';

const LATEST_BOUND = 3000;

function yearField(year: number | undefined): { year: string; beforeCommonEra: boolean } {
	if (year === undefined) return { year: '', beforeCommonEra: false };
	return { year: String(Math.abs(year)), beforeCommonEra: year < 0 };
}

function parsed(year: string, beforeCommonEra: boolean): number | undefined {
	const text = year.trim();
	if (!/^\d{1,5}$/.test(text)) return undefined;
	const value = Number(text);
	return beforeCommonEra ? -value : value;
}

function hasStart(code: EraCode): boolean {
	return ERA_CODES.indexOf(code) > 0;
}

function hasEnd(code: EraCode): boolean {
	return ERA_CODES.indexOf(code) < ERA_CODES.length - 1;
}

export function eraBoundsForm(code: EraCode, junctions: readonly number[]): EraBoundsFormState {
	const start = yearField(hasStart(code) ? eraStartYear(code, junctions) : undefined);
	const end = yearField(eraEndYear(code, junctions));
	return {
		startYear: start.year,
		startBeforeCommonEra: start.beforeCommonEra,
		endYear: end.year,
		endBeforeCommonEra: end.beforeCommonEra
	};
}

export function eraHasStart(code: EraCode): boolean {
	return hasStart(code);
}

export function eraHasEnd(code: EraCode): boolean {
	return hasEnd(code);
}

export function junctionsOf(
	code: EraCode,
	form: EraBoundsFormState,
	junctions: readonly number[]
): number[] | undefined {
	const next = [...junctions];
	const index = ERA_CODES.indexOf(code);
	if (hasStart(code)) {
		const start = parsed(form.startYear, form.startBeforeCommonEra);
		if (start === undefined) return undefined;
		next[index - 1] = start;
	}
	if (hasEnd(code)) {
		const end = parsed(form.endYear, form.endBeforeCommonEra);
		if (end === undefined) return undefined;
		next[index] = end;
	}
	return next;
}

function year(value: number): string {
	return m.atelier.year(value, false);
}

export function validateEraBounds(
	code: EraCode,
	form: EraBoundsFormState,
	junctions: readonly number[]
): EraBoundsErrors {
	const index = ERA_CODES.indexOf(code);
	const errors: EraBoundsErrors = {};
	const start = hasStart(code) ? parsed(form.startYear, form.startBeforeCommonEra) : undefined;
	const end = hasEnd(code) ? parsed(form.endYear, form.endBeforeCommonEra) : undefined;
	if (hasStart(code)) {
		const floor = index >= 2 ? junctions[index - 2] : PREHISTORY_START;
		if (start === undefined) errors.start = m.eraBounds.yearRequired;
		else if (start <= floor) errors.start = m.eraBounds.after(year(floor));
		else if (!hasEnd(code) && start > LATEST_BOUND)
			errors.start = m.eraBounds.before(year(LATEST_BOUND + 1));
	}
	if (hasEnd(code)) {
		const ceiling = index + 1 < junctions.length ? junctions[index + 1] : LATEST_BOUND + 1;
		if (end === undefined) errors.end = m.eraBounds.yearRequired;
		else if (end >= ceiling) errors.end = m.eraBounds.before(year(ceiling));
		else if (start !== undefined && end <= start) errors.end = m.eraBounds.afterStart;
	}
	return errors;
}

export function neighbourNotes(
	code: EraCode,
	saved: readonly number[],
	next: readonly number[] | undefined
): string[] {
	if (!next) return [];
	const index = ERA_CODES.indexOf(code);
	const notes: string[] = [];
	if (hasStart(code) && next[index - 1] !== saved[index - 1]) {
		notes.push(m.eraBounds.previousMoves(eraName(ERA_CODES[index - 1]), year(next[index - 1])));
	}
	if (hasEnd(code) && next[index] !== saved[index]) {
		notes.push(m.eraBounds.nextMoves(eraName(ERA_CODES[index + 1]), year(next[index])));
	}
	return notes;
}

export function outsideEraHref(code: EraCode): ResolvedPathname {
	const filter = { ...emptyFilter(), eras: [code], missing: ['outsideEra' as const] };
	return `${resolve('/(app)/atelier')}?${filterToParams(filter).toString()}` as ResolvedPathname;
}

type Dated = Parameters<typeof yearOutsideEra>[0];

export function newlyOutside(
	artworks: readonly Dated[],
	saved: readonly number[],
	next: readonly number[]
): number {
	return artworks.filter(
		(artwork) => yearOutsideEra(artwork, next) && !yearOutsideEra(artwork, saved)
	).length;
}
