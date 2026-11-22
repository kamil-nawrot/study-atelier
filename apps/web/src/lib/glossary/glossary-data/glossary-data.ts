import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Database } from '#lib/shared/data/database.types.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { cacheKeys, cached, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import {
	sourceColumns,
	sourceFromRow
} from '#lib/shared/data/wikipedia-source/wikipedia-source.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import {
	imageColumns,
	imageOf,
	storedImage,
	uploadPath,
	withPreview
} from '#lib/images/image-record/image-record.ts';
import type { StoredImage } from '#lib/images/types/stored-image.ts';
import { figureDetailsOf } from '#lib/glossary/figure-form/figure-form.ts';
import type { FigureDetails } from '#lib/glossary/types/figure-details.ts';
import { isUuid } from '#lib/shared/utils/ids/ids.ts';
import {
	fitsKind,
	isGlossaryCategory,
	isGlossaryKind
} from '#lib/glossary/categories/categories.ts';
import { glossaryErrorMessage, isNameTakenError } from '#lib/glossary/errors/errors.ts';
import { cleanForms, sortNameOf } from '#lib/glossary/glossary/glossary.ts';
import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { TermDefinitionResult } from '#lib/glossary/types/term-definition-result.ts';
import type { GlossaryEntryResult } from '#lib/glossary/types/glossary-entry-result.ts';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';

type GlossaryResult = {
	entries: GlossaryEntry[];
	error?: string;
};

type TermIndexResult = {
	terms: GlossaryTerm[];
	error?: string;
};

type Row = Database['public']['Tables']['glossary_entries']['Row'];
type TermRow = Pick<
	Row,
	'id' | 'name' | 'kind' | 'category' | 'synonyms' | 'forms' | 'has_definition'
>;

const TERM_COLUMNS = 'id, name, kind, category, synonyms, forms, has_definition';
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

type Classified = { kind: GlossaryKind; category: GlossaryCategory | null };

function classified(row: Pick<Row, 'kind' | 'category'>): Classified | undefined {
	if (!isGlossaryKind(row.kind)) return undefined;
	if (row.category === null) return { kind: row.kind, category: null };
	if (!isGlossaryCategory(row.category) || !fitsKind(row.category, row.kind)) return undefined;
	return { kind: row.kind, category: row.category };
}

function figureOf(row: Row): FigureDetails | undefined {
	if (row.kind !== 'figure') return undefined;
	return {
		birthYear: row.birth_year,
		deathYear: row.death_year,
		yearsApproximate: row.years_approximate,
		country: row.country,
		image: imageOf(row)
	};
}

function entryOf(row: Row): GlossaryEntry | undefined {
	const kind = classified(row);
	if (!kind) return undefined;
	const figure = figureOf(row);
	return {
		id: row.id,
		name: row.name,
		...kind,
		definition: row.definition ?? '',
		synonyms: row.synonyms,
		forms: row.forms,
		hasDefinition: (row.definition ?? '').trim() !== '',
		sortName: row.sort_name,
		source: sourceFromRow(row),
		createdAt: row.created_at,
		...(figure ? { figure } : {})
	};
}

function figureColumns(draft: GlossaryDraft, image: StoredImage | null): Partial<Write> {
	if (draft.kind !== 'figure') return {};
	const details = figureDetailsOf(draft.figure);
	return {
		birth_year: details.birthYear,
		death_year: details.deathYear,
		years_approximate: details.yearsApproximate,
		country: details.country,
		...imageColumns(image)
	};
}

function writeOf(draft: GlossaryDraft, image: StoredImage | null): Write | undefined {
	if (draft.category && !fitsKind(draft.category, draft.kind)) return undefined;
	const definition = draft.definition.trim();
	return {
		name: draft.name.trim(),
		category: draft.category,
		definition: definition === '' ? null : definition,
		synonyms: cleanForms(draft.synonyms),
		forms: cleanForms(draft.forms),
		sort_name: sortNameOf(draft),
		...sourceColumns(draft.source),
		...figureColumns(draft, image)
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
	const kind = classified(row);
	if (!kind) return undefined;
	return {
		id: row.id,
		name: row.name,
		...kind,
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
	if (!entry) return { notFound: true };
	if (entry.figure) entry.figure.image = await withPreview(entry.figure.image);
	return { entry };
}

async function removeReplacedPortrait(
	previous: GlossaryEntry | undefined,
	image: StoredImage | null
): Promise<void> {
	const replaced = uploadPath(previous?.figure?.image ?? null);
	if (replaced && replaced !== uploadPath(image)) await removeOwnImage(replaced);
}

export async function saveGlossaryEntry(
	draft: GlossaryDraft,
	existingId?: string,
	previous?: GlossaryEntry
): Promise<GlossarySaveResult> {
	const figure = draft.kind === 'figure';
	const stored = figure ? await storedImage(draft.figure.image) : { image: null };
	if (stored.error !== undefined) return { error: stored.error };
	const write = writeOf(draft, stored.image);
	if (!write) return { error: glossaryErrorMessage({ code: '23514' }) };
	const newUpload = draft.figure.image?.kind === 'file' ? uploadPath(stored.image) : null;
	const call = existingId
		? supabase.from('glossary_entries').update(write).eq('id', existingId).select('id').single()
		: supabase
				.from('glossary_entries')
				.insert({ ...write, kind: draft.kind })
				.select('id')
				.single();
	const { data, error } = await call;
	if (error) {
		if (newUpload) await removeOwnImage(newUpload);
		if (isNameTakenError(error)) return { nameTaken: true };
		return { error: await failureMessage(error, glossaryErrorMessage) };
	}
	forgetCached([cacheKeys.glossary]);
	if (figure) await removeReplacedPortrait(previous, stored.image);
	return { id: data.id };
}

export async function deleteGlossaryEntry(id: string): Promise<GlossaryDeleteResult> {
	const { error } = await supabase.from('glossary_entries').delete().eq('id', id);
	if (error) return { error: await failureMessage(error, glossaryErrorMessage) };
	forgetCached([cacheKeys.glossary]);
	return {};
}
