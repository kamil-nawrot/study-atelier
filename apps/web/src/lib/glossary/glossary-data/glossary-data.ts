import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Database } from '#lib/shared/data/database.types.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { cacheKeys, cached, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import {
	sourceColumns,
	sourceFromRow
} from '#lib/shared/data/wikipedia-source/wikipedia-source.ts';
import { isUuid } from '#lib/shared/utils/ids/ids.ts';
import { isGlossaryCategory } from '#lib/glossary/categories/categories.ts';
import { glossaryErrorMessage, isNameTakenError } from '#lib/glossary/errors/errors.ts';
import { cleanForms, sortNameOf } from '#lib/glossary/glossary/glossary.ts';
import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { TermDefinitionResult } from '#lib/glossary/types/term-definition-result.ts';
import type { GlossaryEntryResult } from '#lib/glossary/types/glossary-entry-result.ts';

type GlossaryResult = {
	entries: GlossaryEntry[];
	error?: string;
};

type TermIndexResult = {
	terms: GlossaryTerm[];
	error?: string;
};

type Row = Database['public']['Tables']['glossary_entries']['Row'];
type TermRow = Pick<Row, 'id' | 'name' | 'category' | 'synonyms' | 'forms' | 'has_definition'>;

const TERM_COLUMNS = 'id, name, category, synonyms, forms, has_definition';
const DEFINITION_COLUMNS =
	'definition, source_title, source_url, source_licence, source_fetched_on';
type Write = Database['public']['Tables']['glossary_entries']['Insert'];

type GlossarySaveResult = {
	id?: string;
	error?: string;
	nameTaken?: boolean;
};

type GlossaryDeleteResult = {
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
		hasDefinition: (row.definition ?? '').trim() !== '',
		sortName: row.sort_name,
		source: sourceFromRow(row),
		createdAt: row.created_at
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
		...sourceColumns(draft.source)
	};
}

export async function loadGlossary(): Promise<GlossaryResult> {
	const { rows, error } = await fetchAll<Row>((from, to) =>
		supabase.from('glossary_entries').select('*').order('name').range(from, to)
	);
	if (error) return { entries: [], error: glossaryErrorMessage(error) };
	return { entries: rows.flatMap((row) => entryOf(row) ?? []) };
}

function termOf(row: TermRow): GlossaryTerm | undefined {
	if (!isGlossaryCategory(row.category)) return undefined;
	return {
		id: row.id,
		name: row.name,
		category: row.category,
		synonyms: row.synonyms,
		forms: row.forms,
		hasDefinition: row.has_definition === true
	};
}

async function fetchTermIndex(): Promise<TermIndexResult> {
	const { rows, error } = await fetchAll<TermRow>((from, to) =>
		supabase.from('glossary_entries').select(TERM_COLUMNS).order('name').range(from, to)
	);
	if (error) return { terms: [], error: glossaryErrorMessage(error) };
	return { terms: rows.flatMap((row) => termOf(row) ?? []) };
}

export function loadTermIndex(): Promise<TermIndexResult> {
	return cached(cacheKeys.glossary, fetchTermIndex);
}

async function fetchTermDefinition(id: string): Promise<TermDefinitionResult> {
	const { data, error } = await supabase
		.from('glossary_entries')
		.select(DEFINITION_COLUMNS)
		.eq('id', id)
		.maybeSingle();
	if (error) return { error: glossaryErrorMessage(error) };
	if (!data) return { notFound: true };
	return { definition: data.definition ?? '', source: sourceFromRow(data) };
}

export function loadTermDefinition(id: string): Promise<TermDefinitionResult> {
	return cached(`${cacheKeys.glossary}:${id}`, () => fetchTermDefinition(id));
}

export async function loadTermDefinitions(
	ids: readonly string[]
): Promise<{ definitions: Map<string, string>; error?: string }> {
	if (ids.length === 0) return { definitions: new Map() };
	const { data, error } = await supabase
		.from('glossary_entries')
		.select('id, definition')
		.in('id', [...ids]);
	if (error) return { definitions: new Map(), error: glossaryErrorMessage(error) };
	return {
		definitions: new Map(
			data.flatMap((row) => (row.definition ? [[row.id, row.definition] as const] : []))
		)
	};
}

export async function loadGlossaryEntry(id: string): Promise<GlossaryEntryResult> {
	if (!isUuid(id)) return { notFound: true };
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
	forgetCached([cacheKeys.glossary]);
	return { id: data.id };
}

export async function deleteGlossaryEntry(id: string): Promise<GlossaryDeleteResult> {
	const { error } = await supabase.from('glossary_entries').delete().eq('id', id);
	if (error) return { error: await failureMessage(error, glossaryErrorMessage) };
	forgetCached([cacheKeys.glossary]);
	return {};
}
