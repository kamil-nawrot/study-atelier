import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import { m } from '#lib/i18n/i18n.ts';
import { cityKey, tripPlaceOf } from '#lib/chronicle/trip-artworks/trip-artworks.ts';
import { tripDateName } from '#lib/chronicle/trip-date/trip-date.ts';
import { dateFromParts, isVisitDate } from '#lib/chronicle/visit-date/visit-date.ts';
import { placeOf } from '#lib/chronicle/visit-form/visit-form.ts';
import type { SuggestionSource } from '#lib/chronicle/types/suggestion-source.ts';
import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';
import type { SelectOption } from '@study-atelier/ui';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitDate } from '#lib/chronicle/types/visit-date.ts';

function lastDay(date: VisitDate): string {
	const [year, month] = date.on.split('-').map(Number);
	if (date.precision === 'year') return `${year}-12-31`;
	if (date.precision === 'day') return date.on;
	const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
	return `${date.on.slice(0, 8)}${String(day).padStart(2, '0')}`;
}

export function tripsCovering(trips: readonly Visit[], date: VisitDate): Visit[] {
	const [from, to] = [date.on, lastDay(date)];
	return trips.filter((trip) => {
		const end = trip.endsOn ?? lastDay(trip.date);
		return trip.date.on <= to && end >= from;
	});
}

export function sameCityTrip(
	trips: readonly Visit[],
	place: string,
	places: readonly TripPlace[]
): Visit | undefined {
	const key = valueKey(place);
	if (key === '') return undefined;
	const visited = tripPlaceOf(places, place);
	const city = visited ? cityKey(visited) : null;
	return trips.find((trip) => {
		if (valueKey(trip.place) === key) return true;
		const target = tripPlaceOf(places, trip.place);
		return city !== null && target !== undefined && cityKey(target) === city;
	});
}

export function tripOptions(trips: readonly Visit[]): SelectOption[] {
	return [
		{ value: '', label: m.chronicle.form.noTrip },
		...trips.map((trip) => ({ value: trip.id, label: `${trip.place}, ${tripDateName(trip)}` }))
	];
}

export type TripLink = {
	trips: Visit[];
	tripId: string;
	outside: boolean;
};

export function linkedTrip(
	form: VisitFormState,
	trips: readonly Visit[],
	source: Pick<SuggestionSource, 'tripPlaces'>,
	chosen: boolean
): TripLink {
	const date = dateFromParts(form);
	if (form.kind !== 'visit' || !isVisitDate(date)) return { trips: [], tripId: '', outside: false };
	const covering = tripsCovering(trips, date);
	if (chosen) {
		if (covering.some((trip) => trip.id === form.tripId)) {
			return { trips: covering, tripId: form.tripId, outside: false };
		}
		const stored = trips.find((trip) => trip.id === form.tripId);
		return stored
			? { trips: [...covering, stored], tripId: stored.id, outside: true }
			: { trips: covering, tripId: '', outside: false };
	}
	const match = sameCityTrip(covering, placeOf(form), source.tripPlaces);
	return { trips: covering, tripId: match?.id ?? '', outside: false };
}
