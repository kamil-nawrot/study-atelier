import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { fetchAll } from '#lib/collection/card-index-data.ts';
import { supabase } from '#lib/supabase.ts';
import type { Database } from '#lib/database.types.ts';
import { isGlossaryCategory } from './categories.ts';
import { glossaryErrorMessage, isNameTakenError } from './errors.ts';
import { cleanForms, sortNameOf } from './glossary.ts';
import type { GlossaryDraft, GlossaryEntry, GlossaryEntryResult, GlossaryResult } from './types.ts';

type Row = Database['public']['Tables']['glossary_entries']['Row'];
type Write = Database['public']['Tables']['glossary_entries']['Insert'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type GlossarySaveResult = {
	id?: string;
	error?: string;
	nameTaken?: boolean;
};

export type GlossaryDeleteResult = {
	error?: string;
};

function entryOf(row: Row): GlossaryEntry | undefined {
	if (!isGlossaryCategory(row.category)) return undefined;
	return {
		id: row.id,
		name: row.name,
		category: row.category,
		definition: row.definition ?? '',
		synonyms: row.synonyms,
		forms: row.forms,
		sortName: row.sort_name,
		source:
			row.source_title && row.source_url && row.source_licence && row.source_fetched_on
				? {
						title: row.source_title,
						url: row.source_url,
						licence: row.source_licence,
						fetchedOn: row.source_fetched_on
					}
				: null
	};
}

function writeOf(draft: GlossaryDraft): Write | undefined {
	if (!draft.category) return undefined;
	const definition = draft.definition.trim();
	return {
		name: draft.name.trim(),
		category: draft.category,
		definition: definition === '' ? null : definition,
		synonyms: cleanForms(draft.synonyms),
		forms: cleanForms(draft.forms),
		sort_name: sortNameOf(draft),
		source_title: draft.source?.title ?? null,
		source_url: draft.source?.url ?? null,
		source_licence: draft.source?.licence ?? null,
		source_fetched_on: draft.source?.fetchedOn ?? null
	};
}

export async function loadGlossary(): Promise<GlossaryResult> {
	const { rows, error } = await fetchAll<Row>((from, to) =>
		supabase.from('glossary_entries').select('*').order('name').range(from, to)
	);
	if (error) return { entries: [], error: glossaryErrorMessage(error) };
	return { entries: rows.flatMap((row) => entryOf(row) ?? []) };
}

export async function loadGlossaryEntry(id: string): Promise<GlossaryEntryResult> {
	if (!UUID.test(id)) return { notFound: true };
	const { data, error } = await supabase
		.from('glossary_entries')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) return { error: glossaryErrorMessage(error) };
	const entry = data ? entryOf(data) : undefined;
	return entry ? { entry } : { notFound: true };
}

export async function saveGlossaryEntry(
	draft: GlossaryDraft,
	existingId?: string
): Promise<GlossarySaveResult> {
	const write = writeOf(draft);
	if (!write) return { error: glossaryErrorMessage({ code: '23514' }) };
	const call = existingId
		? supabase.from('glossary_entries').update(write).eq('id', existingId).select('id').single()
		: supabase.from('glossary_entries').insert(write).select('id').single();
	const { data, error } = await call;
	if (error) {
		if (isNameTakenError(error)) return { nameTaken: true };
		return { error: await failureMessage(error, glossaryErrorMessage) };
	}
	return { id: data.id };
}

export async function deleteGlossaryEntry(id: string): Promise<GlossaryDeleteResult> {
	const { error } = await supabase.from('glossary_entries').delete().eq('id', id);
	return error ? { error: await failureMessage(error, glossaryErrorMessage) } : {};
}
