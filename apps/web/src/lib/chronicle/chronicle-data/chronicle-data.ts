import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { chronicleErrorMessage, tripErrorMessage } from '#lib/chronicle/errors/errors.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { cacheKeys, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { isUuid } from '#lib/shared/utils/ids/ids.ts';
import type { DatePrecision } from '#lib/chronicle/types/date-precision.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitDraft } from '#lib/chronicle/types/visit-draft.ts';
import type { VisitKind } from '#lib/chronicle/types/visit-kind.ts';
import type { VisitResult } from '#lib/chronicle/types/visit-result.ts';
import type { PlaceType } from '#lib/catalogue/types/place-type.ts';

type VisitsResult = {
	visits: Visit[];
	error?: string;
};

type VisitSaveResult = {
	id?: string;
	error?: string;
};

type VisitDeleteResult = {
	error?: string;
};

type PlaceRow = {
	place_type: PlaceType | null;
	country_code: string | null;
};

type VisitRow = {
	id: string;
	kind: VisitKind;
	visited_on: string;
	ends_on: string | null;
	trip_id: string | null;
	date_precision: DatePrecision;
	notes: string | null;
	category_values: {
		name: string;
		location_details: PlaceRow | PlaceRow[] | null;
	} | null;
	visit_artworks: { artwork_id: string }[] | null;
};

const ENTRY_COLUMNS =
	'id, kind, visited_on, ends_on, trip_id, date_precision, notes, category_values(name, location_details!location_details_value_id_owner_id_category_code_fkey(place_type, country_code))';

const VISIT_COLUMNS = `${ENTRY_COLUMNS}, visit_artworks(artwork_id)`;

function visitOf(row: VisitRow): Visit {
	const place = row.category_values?.location_details;
	const details = Array.isArray(place) ? place[0] : place;
	return {
		id: row.id,
		kind: row.kind ?? 'visit',
		place: row.category_values?.name ?? '',
		placeType: details?.place_type ?? null,
		countryCode: details?.country_code ?? null,
		date: { on: row.visited_on, precision: row.date_precision },
		endsOn: row.ends_on ?? null,
		tripId: row.trip_id ?? null,
		notes: row.notes ?? '',
		artworkIds: (row.visit_artworks ?? []).map((seen) => seen.artwork_id)
	};
}

export async function loadVisits(): Promise<VisitsResult> {
	const { rows, error } = await fetchAll<VisitRow>((from, to) =>
		supabase
			.from('visits')
			.select(VISIT_COLUMNS)
			.order('visited_on', { ascending: false })
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { visits: [], error: chronicleErrorMessage(error) };
	return { visits: rows.map(visitOf) };
}

export async function loadTrips(): Promise<VisitsResult> {
	const { rows, error } = await fetchAll<VisitRow>((from, to) =>
		supabase
			.from('visits')
			.select(ENTRY_COLUMNS)
			.eq('kind', 'trip')
			.order('visited_on', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { visits: [], error: chronicleErrorMessage(error) };
	return { visits: rows.map(visitOf) };
}

export async function loadArtworkVisits(number: number): Promise<VisitsResult> {
	const { rows, error } = await fetchAll<VisitRow>((from, to) =>
		supabase
			.from('visits')
			.select(`${ENTRY_COLUMNS}, visit_artworks!inner(artwork_id, artworks!inner(record_number))`)
			.eq('visit_artworks.artworks.record_number', number)
			.order('visited_on', { ascending: false })
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { visits: [], error: chronicleErrorMessage(error) };
	return { visits: rows.map(visitOf) };
}

export async function loadPlaceVisits(placeId: string): Promise<VisitsResult> {
	const { rows, error } = await fetchAll<VisitRow>((from, to) =>
		supabase
			.from('visits')
			.select(VISIT_COLUMNS)
			.eq('place_id', placeId)
			.order('visited_on', { ascending: false })
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { visits: [], error: chronicleErrorMessage(error) };
	return { visits: rows.map(visitOf) };
}

export async function loadPlacesVisits(placeIds: string[]): Promise<VisitsResult> {
	const { rows, error } = await fetchAll<VisitRow>((from, to) =>
		supabase
			.from('visits')
			.select(VISIT_COLUMNS)
			.in('place_id', placeIds)
			.order('visited_on', { ascending: false })
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { visits: [], error: chronicleErrorMessage(error) };
	return { visits: rows.map(visitOf) };
}

export async function loadTripVisits(tripId: string): Promise<VisitsResult> {
	const { rows, error } = await fetchAll<VisitRow>((from, to) =>
		supabase
			.from('visits')
			.select(VISIT_COLUMNS)
			.eq('trip_id', tripId)
			.order('visited_on')
			.order('created_at')
			.order('id')
			.range(from, to)
	);
	if (error) return { visits: [], error: chronicleErrorMessage(error) };
	return { visits: rows.map(visitOf) };
}

export async function loadVisit(id: string): Promise<VisitResult> {
	if (!isUuid(id)) return { notFound: true };
	const { data, error } = await supabase
		.from('visits')
		.select(VISIT_COLUMNS)
		.eq('id', id)
		.maybeSingle();
	if (error) return { error: chronicleErrorMessage(error) };
	return data ? { visit: visitOf(data as unknown as VisitRow) } : { notFound: true };
}

export async function saveVisit(draft: VisitDraft, existingId?: string): Promise<VisitSaveResult> {
	const notes = draft.notes.trim();
	const { data, error } = await supabase.rpc('save_visit', {
		visit: {
			kind: draft.kind,
			visited_on: draft.date.on,
			date_precision: draft.date.precision,
			ends_on: draft.endsOn,
			trip_id: draft.tripId,
			notes: notes === '' ? null : notes
		},
		place: draft.place.trim(),
		artwork_ids: draft.artworkIds,
		...(existingId ? { existing_id: existingId } : {})
	});
	forgetCached([
		cacheKeys.atelier,
		cacheKeys.cardIndex,
		cacheKeys.categoryValues,
		cacheKeys.valueLinks
	]);
	if (error) {
		const message = draft.kind === 'trip' ? tripErrorMessage : chronicleErrorMessage;
		return { error: await failureMessage(error, message) };
	}
	return { id: data };
}

export async function deleteVisit(id: string): Promise<VisitDeleteResult> {
	const { error } = await supabase.from('visits').delete().eq('id', id);
	forgetCached([
		cacheKeys.atelier,
		cacheKeys.cardIndex,
		cacheKeys.categoryValues,
		cacheKeys.valueLinks
	]);
	return error ? { error: await failureMessage(error, chronicleErrorMessage) } : {};
}
