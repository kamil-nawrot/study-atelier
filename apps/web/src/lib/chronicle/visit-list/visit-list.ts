import { visitYear } from '#lib/chronicle/visit-date/visit-date.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitEntry } from '#lib/chronicle/types/visit-entry.ts';
import type { VisitYear } from '#lib/chronicle/types/visit-year.ts';

function entriesOf(visits: readonly Visit[]): VisitEntry[] {
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
	return entries.sort((a, b) => b.visit.date.on.localeCompare(a.visit.date.on));
}

export function visitsByYear(visits: readonly Visit[]): VisitYear[] {
	const years: VisitYear[] = [];
	for (const entry of entriesOf(visits)) {
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
	return years.find((group) => group.year === current)?.year ?? years[0]?.year;
}
