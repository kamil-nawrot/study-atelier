import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { supabase } from '#lib/supabase.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from './errors.ts';
import type { ValueDetails, ValueDetailsResult, ValueSubject } from './types.ts';

type ErrorLike = { code?: string; message?: string };

type DetailsRow = { summary: string | null; notes: string | null };

type DetailsQuery = PromiseLike<{ data: DetailsRow | null; error: ErrorLike | null }>;

export type SaveDetailsResult = {
	error?: string;
};

export function emptyValueDetails(): ValueDetails {
	return { summary: '', notes: '' };
}

function detailsQuery(subject: ValueSubject): DetailsQuery {
	const columns = 'summary, notes';
	switch (subject.kind) {
		case 'era':
			return supabase
				.from('era_details')
				.select(columns)
				.eq('era_code', subject.code)
				.maybeSingle();
		case 'period':
			return supabase
				.from('period_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'style':
			return supabase
				.from('style_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'material':
			return supabase
				.from('material_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'author':
			return supabase
				.from('author_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'location':
			return supabase
				.from('location_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
	}
}

export async function loadValueDetails(subject: ValueSubject): Promise<ValueDetailsResult> {
	const { data, error } = await detailsQuery(subject);
	if (error) return { details: emptyValueDetails(), error: collectionErrorMessage(error) };
	return { details: { summary: data?.summary ?? '', notes: data?.notes ?? '' } };
}

export function valueDetailsChanged(a: ValueDetails, b: ValueDetails): boolean {
	return a.summary.trim() !== b.summary.trim() || a.notes !== b.notes;
}

export async function saveValueDetails(
	subject: ValueSubject,
	details: ValueDetails
): Promise<SaveDetailsResult> {
	const payload = { summary: details.summary.trim(), notes: details.notes.trim() };
	const { error } =
		subject.kind === 'era'
			? await supabase.rpc('save_era_details', { target_era: subject.code, details: payload })
			: await supabase.rpc('save_value_details', {
					target_value: subject.record.id,
					details: payload
				});
	return error ? { error: await failureMessage(error, cardIndexErrorMessage) } : {};
}
