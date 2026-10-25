import { visitYear } from '#lib/chronicle/visit-date/visit-date.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitYear } from '#lib/chronicle/types/visit-year.ts';

export function visitsByYear(visits: readonly Visit[]): VisitYear[] {
	const sorted = [...visits].sort((a, b) => b.date.on.localeCompare(a.date.on));
	const years: VisitYear[] = [];
	for (const visit of sorted) {
		const year = visitYear(visit.date);
		const last = years.at(-1);
		if (last?.year === year) last.visits.push(visit);
		else years.push({ year, visits: [visit] });
	}
	return years;
}

export function openYear(years: readonly VisitYear[], now = new Date()): number | undefined {
	const current = now.getFullYear();
	return years.find((group) => group.year === current)?.year ?? years[0]?.year;
}
