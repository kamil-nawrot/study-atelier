import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import {
	exhibitionErrorMessage,
	isLastingSaveError,
	isRevisionConflict
} from '#lib/exhibitions/errors/errors.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Exhibition } from '#lib/exhibitions/types/exhibition.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';
import type { SaveResult } from '#lib/exhibitions/types/save-result.ts';

export type ExhibitionRow = {
	id: string;
	title: string;
	updated_at: string;
	deleted_at: string | null;
	exhibition_artworks: ExhibitionArtworkRow[] | null;
};

type ExhibitionArtworkRow = {
	artwork_id: string;
	position: number;
	artworks: { deleted_at: string | null } | null;
};

export const SUMMARY_COLUMNS =
	'id, title, updated_at, deleted_at, exhibition_artworks(artwork_id, position, artworks(deleted_at))';

type SummariesResult = {
	exhibitions: (ExhibitionSummary & { deletedAt: string | null })[];
	error?: string;
};

type LoadResult = {
	exhibition?: Exhibition;
	error?: string;
};

type ActionResult = {
	error?: string;
};

export const BLANK_DOCUMENT: ExhibitionDocument = { type: 'doc', content: [] };

export function summaryOf(row: ExhibitionRow): SummariesResult['exhibitions'][number] {
	const artworks = (row.exhibition_artworks ?? [])
		.filter((artwork) => artwork.artworks?.deleted_at === null)
		.sort((a, b) => a.position - b.position);
	const cover = artworks[0];
	return {
		id: row.id,
		title: row.title,
		updatedAt: row.updated_at,
		deletedAt: row.deleted_at,
		artworkCount: artworks.length,
		coverId: cover?.artwork_id ?? null
	};
}

export async function loadExhibitionSummaries(archived: boolean): Promise<SummariesResult> {
	const { rows, error } = await fetchAll<ExhibitionRow>((from, to) => {
		const query = supabase.from('exhibitions').select(SUMMARY_COLUMNS);
		const filtered = archived ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
		return filtered
			.order(archived ? 'deleted_at' : 'updated_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to);
	});
	if (error) return { exhibitions: [], error: exhibitionErrorMessage(error) };
	return { exhibitions: rows.map(summaryOf) };
}

export async function loadExhibition(id: string): Promise<LoadResult> {
	const { data, error } = await supabase
		.from('exhibitions')
		.select('id, title, document, revision, updated_at')
		.eq('id', id)
		.is('deleted_at', null)
		.maybeSingle();
	if (error) return { error: exhibitionErrorMessage(error) };
	if (!data) return {};
	return {
		exhibition: {
			id: data.id,
			title: data.title,
			document: data.document as ExhibitionDocument,
			revision: data.revision,
			updatedAt: data.updated_at
		}
	};
}

export async function saveExhibition(
	id: string,
	title: string,
	document: ExhibitionDocument,
	revision: number | null
): Promise<SaveResult> {
	const { data, error } = await supabase.rpc('save_exhibition', {
		exhibition_id: id,
		new_title: title,
		new_document: document as Json,
		...(revision === null ? {} : { expected_revision: revision })
	});
	if (error) {
		if (isRevisionConflict(error)) return { conflict: true };
		const message = await failureMessage(error, exhibitionErrorMessage);
		return isLastingSaveError(error) ? { error: message, rejected: true } : { error: message };
	}
	return { revision: data };
}

async function setDeletedAt(id: string, deletedAt: string | null): Promise<ActionResult> {
	const { error } = await supabase
		.from('exhibitions')
		.update({ deleted_at: deletedAt })
		.eq('id', id);
	return error ? { error: await failureMessage(error, exhibitionErrorMessage) } : {};
}

export function archiveExhibition(id: string, now = new Date()): Promise<ActionResult> {
	return setDeletedAt(id, now.toISOString());
}

export function restoreExhibition(id: string): Promise<ActionResult> {
	return setDeletedAt(id, null);
}

export async function deleteExhibition(id: string): Promise<ActionResult> {
	const { error } = await supabase.from('exhibitions').delete().eq('id', id);
	return error ? { error: await failureMessage(error, exhibitionErrorMessage) } : {};
}

export async function createExhibition(title: string): Promise<ActionResult & { id?: string }> {
	const id = crypto.randomUUID();
	const result = await saveExhibition(id, title, BLANK_DOCUMENT, null);
	if (result.error) return { error: result.error };
	return { id };
}
