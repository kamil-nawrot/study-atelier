import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import { visitYear } from '#lib/chronicle/visit-date/visit-date.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitEntry } from '#lib/chronicle/types/visit-entry.ts';
import type { VisitSort } from '#lib/chronicle/visit-sort/visit-sort.ts';
import type { VisitYear } from '#lib/chronicle/types/visit-year.ts';

function entriesOf(visits: readonly Visit[], sort: VisitSort): VisitEntry[] {
	const trips = new Map(
		visits
			.filter((visit) => visit.kind === 'trip')
			.map((trip): [string, VisitEntry] => [trip.id, { visit: trip, visits: [] }])
	);
	const entries: VisitEntry[] = [];
	for (const visit of visits) {
		const trip = visit.tripId ? trips.get(visit.tripId) : undefined;
		if (trip) trip.visits.push(visit);
		else entries.push(trips.get(visit.id) ?? { visit, visits: [] });
	}
	for (const trip of trips.values()) {
		trip.visits.sort((a, b) => a.date.on.localeCompare(b.date.on));
	}
	const direction = sort === 'oldest' ? 1 : -1;
	return entries.sort((a, b) => direction * a.visit.date.on.localeCompare(b.visit.date.on));
}

export function matchingVisits(visits: readonly Visit[], query: string): readonly Visit[] {
	const term = normalizeForSearch(query);
	if (!term) return visits;
	const matching = visits.filter((visit) => normalizeForSearch(visit.place).includes(term));
	const kept = new Set<string>();
	for (const visit of matching) {
		kept.add(visit.id);
		if (visit.tripId) kept.add(visit.tripId);
		if (visit.kind === 'trip') {
			for (const inner of visits) if (inner.tripId === visit.id) kept.add(inner.id);
		}
	}
	return visits.filter((visit) => kept.has(visit.id));
}

export function visitsByYear(visits: readonly Visit[], sort: VisitSort = 'newest'): VisitYear[] {
	const years: VisitYear[] = [];
	for (const entry of entriesOf(visits, sort)) {
		const year = visitYear(entry.visit.date);
		const count = 1 + entry.visits.length;
		const last = years.at(-1);
		if (last?.year === year) {
			last.entries.push(entry);
			last.count += count;
		} else years.push({ year, entries: [entry], count });
	}
	return years;
}

export function openYear(years: readonly VisitYear[], now = new Date()): number | undefined {
	const current = now.getFullYear();
	if (years.length === 0) return undefined;
	return (
		years.find((group) => group.year === current)?.year ??
		Math.max(...years.map(({ year }) => year))
	);
}
