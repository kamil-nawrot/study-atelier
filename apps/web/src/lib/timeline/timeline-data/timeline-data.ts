import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Database } from '#lib/shared/data/database.types.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import {
	sourceColumns,
	sourceFromRow
} from '#lib/shared/data/wikipedia-source/wikipedia-source.ts';
import { isUuid } from '#lib/shared/utils/ids/ids.ts';
import { timelineErrorMessage } from '#lib/timeline/errors/errors.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { TimelineEventDraft } from '#lib/timeline/types/timeline-event-draft.ts';
import type { TimelineEventResult } from '#lib/timeline/types/timeline-event-result.ts';

type TimelineEventsResult = {
	events: TimelineEvent[];
	error?: string;
};

type TimelineEventSaveResult = {
	id?: string;
	error?: string;
};

type TimelineEventDeleteResult = {
	error?: string;
};

type Row = Database['public']['Tables']['timeline_events']['Row'];
type Write = Database['public']['Tables']['timeline_events']['Insert'];

function eventOf(row: Row): TimelineEvent {
	return {
		id: row.id,
		name: row.name,
		yearFrom: row.year_from,
		yearTo: row.year_to,
		yearApproximate: row.year_approximate,
		description: row.description ?? '',
		source: sourceFromRow(row)
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
		description: description === '' ? null : description,
		...sourceColumns(draft.source)
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
	if (!isUuid(id)) return { notFound: true };
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
