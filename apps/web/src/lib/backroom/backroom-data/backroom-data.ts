import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { flagErrorMessage } from '#lib/backroom/errors/errors.ts';
import type { FlagQuestion } from '#lib/backroom/types/flag-question.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import type { FlagRecord } from '#lib/backroom/types/flag-record.ts';
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
	artwork_images: { position: number } | null;
	symbols: { name: string } | null;
};

const COLUMNS =
	'id, reason, comment, question, artwork_id, term_id, symbol_id, artwork_images(position), symbols(name)';

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
		imageNumber: row.artwork_images ? row.artwork_images.position + 1 : null
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

export async function deleteFlag(id: string): Promise<{ error?: string }> {
	const { error } = await supabase.from('learner_flags').delete().eq('id', id);
	return error ? { error: await failureMessage(error, flagErrorMessage) } : {};
}
