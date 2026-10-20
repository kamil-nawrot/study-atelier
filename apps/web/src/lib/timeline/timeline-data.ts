import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { fetchAll } from '#lib/collection/card-index-data.ts';
import { supabase } from '#lib/supabase.ts';
import type { Database } from '#lib/database.types.ts';
import { timelineErrorMessage } from './errors.ts';
import type {
	TimelineEvent,
	TimelineEventDeleteResult,
	TimelineEventDraft,
	TimelineEventResult,
	TimelineEventSaveResult,
	TimelineEventsResult
} from './types.ts';

type Row = Database['public']['Tables']['timeline_events']['Row'];
type Write = Database['public']['Tables']['timeline_events']['Insert'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function eventOf(row: Row): TimelineEvent {
	return {
		id: row.id,
		name: row.name,
		yearFrom: row.year_from,
		yearTo: row.year_to,
		yearApproximate: row.year_approximate,
		description: row.description ?? ''
	};
}

function writeOf(draft: TimelineEventDraft): Write | undefined {
	if (draft.yearTo === null) return undefined;
	const description = draft.description.trim();
	return {
		name: draft.name.trim(),
		year_from: draft.yearFrom === draft.yearTo ? null : draft.yearFrom,
		year_to: draft.yearTo,
		year_approximate: draft.yearApproximate,
		description: description === '' ? null : description
	};
}

export async function loadTimelineEvents(): Promise<TimelineEventsResult> {
	const { rows, error } = await fetchAll<Row>((from, to) =>
		supabase.from('timeline_events').select('*').order('year_to').order('id').range(from, to)
	);
	if (error) return { events: [], error: timelineErrorMessage(error) };
	return { events: rows.map(eventOf) };
}

export async function loadTimelineEvent(id: string): Promise<TimelineEventResult> {
	if (!UUID.test(id)) return { notFound: true };
	const { data, error } = await supabase
		.from('timeline_events')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) return { error: timelineErrorMessage(error) };
	return data ? { event: eventOf(data) } : { notFound: true };
}

export async function saveTimelineEvent(
	draft: TimelineEventDraft,
	existingId?: string
): Promise<TimelineEventSaveResult> {
	const write = writeOf(draft);
	if (!write) return { error: timelineErrorMessage({ code: '23502' }) };
	const call = existingId
		? supabase.from('timeline_events').update(write).eq('id', existingId).select('id').single()
		: supabase.from('timeline_events').insert(write).select('id').single();
	const { data, error } = await call;
	if (error) return { error: await failureMessage(error, timelineErrorMessage) };
	return { id: data.id };
}

export async function deleteTimelineEvent(id: string): Promise<TimelineEventDeleteResult> {
	const { error } = await supabase.from('timeline_events').delete().eq('id', id);
	return error ? { error: await failureMessage(error, timelineErrorMessage) } : {};
}
