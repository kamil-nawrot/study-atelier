import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { flagErrorMessage } from '#lib/backroom/errors/errors.ts';
import type { FlagQuestion } from '#lib/backroom/types/flag-question.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import type { FlagRecord } from '#lib/backroom/types/flag-record.ts';
import type { FlagTarget } from '#lib/backroom/types/flag-target.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type FlagRow = {
	id: string;
	reason: FlagReason;
	comment: string | null;
	question: FlagQuestion | null;
	artwork_id: string | null;
	term_id: string | null;
	symbol_id: string | null;
	event_id: string | null;
	image_id: string | null;
	pin_id: string | null;
	artwork_images: { position: number } | null;
	symbols: { name: string } | null;
	timeline_events: { name: string } | null;
	holds: boolean;
};

const COLUMNS =
	'id, reason, comment, question, holds, artwork_id, term_id, symbol_id, event_id, image_id, pin_id, artwork_images(position), symbols(name), timeline_events(name)';

function recordOf(row: FlagRow): FlagRecord {
	return {
		id: row.id,
		reason: row.reason,
		comment: row.comment,
		question: row.question,
		artworkId: row.artwork_id,
		termId: row.term_id,
		symbolId: row.symbol_id,
		symbolName: row.symbols?.name ?? null,
		eventId: row.event_id,
		eventName: row.timeline_events?.name ?? null,
		imageId: row.image_id,
		imageNumber: row.artwork_images ? row.artwork_images.position + 1 : null,
		pinId: row.pin_id,
		holds: row.holds === true
	};
}

export async function loadFlags(): Promise<{ flags: FlagRecord[]; error?: string }> {
	const { rows, error } = await fetchAll<FlagRow>((from, to) =>
		supabase
			.from('learner_flags')
			.select(COLUMNS)
			.order('created_at', { ascending: false })
			.order('id')
			.range(from, to)
	);
	return error ? { flags: [], error: flagErrorMessage(error) } : { flags: rows.map(recordOf) };
}

export async function countFlags(): Promise<number | undefined> {
	const { data, error } = await supabase.rpc('flag_count');
	return error ? undefined : data;
}

export async function deleteItemFlags(target: FlagTarget): Promise<{ error?: string }> {
	const [key, value] = Object.entries(target)[0];
	const { error } = await supabase
		.from('learner_flags')
		.delete()
		.eq(TARGET_COLUMNS[key as keyof typeof TARGET_COLUMNS], value as string);
	return error ? { error: await failureMessage(error, flagErrorMessage) } : {};
}

export async function deleteFlag(id: string): Promise<{ error?: string }> {
	const { error } = await supabase.from('learner_flags').delete().eq('id', id);
	return error ? { error: await failureMessage(error, flagErrorMessage) } : {};
}

type StoredRow = {
	id: string;
	reason: FlagReason;
	comment: string | null;
	artwork_id: string | null;
	term_id: string | null;
	symbol_id: string | null;
	event_id: string | null;
	image_id: string | null;
	pin_id: string | null;
	holds: boolean;
	question: FlagQuestion | null;
	artwork_images: { position: number } | null;
};

const STORED_COLUMNS =
	'id, reason, comment, artwork_id, term_id, symbol_id, event_id, image_id, pin_id, holds, question, artwork_images(position)';

const TARGET_COLUMNS = {
	artworkId: 'artwork_id',
	termId: 'term_id',
	symbolId: 'symbol_id',
	eventId: 'event_id'
} as const;

function storedOf(row: StoredRow): StoredFlag {
	return {
		id: row.id,
		reason: row.reason,
		comment: row.comment,
		artworkId: row.artwork_id,
		termId: row.term_id,
		symbolId: row.symbol_id,
		eventId: row.event_id,
		imageId: row.image_id,
		imageNumber: row.artwork_images ? row.artwork_images.position + 1 : null,
		pinId: row.pin_id,
		holds: row.holds === true,
		question: row.question,
		mode: row.question?.mode ?? null
	};
}

export async function loadItemFlags(target?: FlagTarget): Promise<StoredFlag[]> {
	const { rows, error } = await fetchAll<StoredRow>((from, to) => {
		const query = supabase.from('learner_flags').select(STORED_COLUMNS);
		const [key, value] = target ? Object.entries(target)[0] : [];
		const narrowed = key
			? query.eq(TARGET_COLUMNS[key as keyof typeof TARGET_COLUMNS], value as string)
			: query;
		return narrowed.order('id').range(from, to);
	});
	return error ? [] : rows.map(storedOf);
}
