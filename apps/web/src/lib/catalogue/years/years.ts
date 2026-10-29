import { m } from '#lib/i18n/i18n.ts';

export function formatYear(year: number | null, approximate: boolean): string | undefined {
	return year === null ? undefined : m.atelier.year(year, approximate);
}

export function signedYear(year: number | null, beforeCommonEra: boolean): number | null {
	if (year === null) return null;
	return beforeCommonEra ? -year : year;
}

export function formatDate(
	yearFrom: number | null,
	yearTo: number | null,
	approximate: boolean
): string | undefined {
	if (yearTo === null) return undefined;
	if (yearFrom === null || yearFrom === yearTo) return m.atelier.year(yearTo, approximate);
	return m.atelier.span(yearFrom, yearTo, approximate);
}

export function formatYearRange(from: number | null, to: number | null): string | undefined {
	if (from === null || to === null) return undefined;
	const start = m.atelier.year(from, false);
	return from === to ? start : m.atelier.yearRange(start, m.atelier.year(to, false));
}

export function formatLifeYears(
	born: number | null,
	died: number | null,
	approximate: boolean
): string | undefined {
	if (born !== null && died !== null) return m.atelier.span(born, died, approximate);
	if (born !== null) return m.valuePage.born(m.atelier.year(born, approximate));
	if (died !== null) return m.valuePage.died(m.atelier.year(died, approximate));
	return undefined;
}
