import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { chronicleErrorMessage } from '#lib/chronicle/errors/errors.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { isUuid } from '#lib/shared/utils/ids/ids.ts';
import type { DatePrecision } from '#lib/chronicle/types/date-precision.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitDraft } from '#lib/chronicle/types/visit-draft.ts';
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
	visited_on: string;
	date_precision: DatePrecision;
	notes: string | null;
	category_values: {
		name: string;
		location_details: PlaceRow | PlaceRow[] | null;
	} | null;
	visit_artworks: { artwork_id: string }[] | null;
};

const VISIT_COLUMNS =
	'id, visited_on, date_precision, notes, category_values(name, location_details(place_type, country_code)), visit_artworks(artwork_id)';

function visitOf(row: VisitRow): Visit {
	const place = row.category_values?.location_details;
	const details = Array.isArray(place) ? place[0] : place;
	return {
		id: row.id,
		place: row.category_values?.name ?? '',
		placeType: details?.place_type ?? null,
		countryCode: details?.country_code ?? null,
		date: { on: row.visited_on, precision: row.date_precision },
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
			.range(from, to)
	);
	if (error) return { visits: [], error: chronicleErrorMessage(error) };
	return { visits: rows.map(visitOf) };
}

export async function loadArtworkVisits(number: number): Promise<VisitsResult> {
	const { rows, error } = await fetchAll<VisitRow>((from, to) =>
		supabase
			.from('visits')
			.select(
				'id, visited_on, date_precision, notes, category_values(name, location_details(place_type, country_code)), visit_artworks!inner(artwork_id, artworks!inner(record_number))'
			)
			.eq('visit_artworks.artworks.record_number', number)
			.order('visited_on', { ascending: false })
			.order('created_at', { ascending: false })
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
			visited_on: draft.date.on,
			date_precision: draft.date.precision,
			notes: notes === '' ? null : notes
		},
		place: draft.place.trim(),
		artwork_ids: draft.artworkIds,
		...(existingId ? { existing_id: existingId } : {})
	});
	if (error) return { error: await failureMessage(error, chronicleErrorMessage) };
	return { id: data };
}

export async function deleteVisit(id: string): Promise<VisitDeleteResult> {
	const { error } = await supabase.from('visits').delete().eq('id', id);
	return error ? { error: await failureMessage(error, chronicleErrorMessage) } : {};
}
