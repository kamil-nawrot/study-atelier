import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	ARTWORK_COLUMNS,
	fetchAllRows,
	rememberedArtwork,
	wallArtwork
} from '#lib/wall/wall-data/wall-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

type ArtworksResult = {
	artworks: WallArtwork[];
	error?: string;
};

type NoteRow = {
	id: string;
	notes: string | null;
};

type NotesResult = {
	notes: Map<string, string>;
	error?: string;
};

type SuggestionRow = {
	kind: string;
	id: string;
};

const RECENT_COUNT = 12;
const SEARCH_LIMIT = 20;
const CHUNK_SIZE = 50;

function wallArtworks(rows: Parameters<typeof wallArtwork>[0][]): WallArtwork[] {
	return rows.map(wallArtwork).map((artwork) => rememberedArtwork(artwork) ?? artwork);
}

async function loadChunk(ids: readonly string[]): Promise<ArtworksResult> {
	const { rows, error } = await fetchAllRows((from, to) =>
		supabase
			.from('artworks')
			.select(ARTWORK_COLUMNS)
			.in('id', [...ids])
			.eq('artwork_images.position', 0)
			.is('deleted_at', null)
			.limit(1, { referencedTable: 'visit_artworks' })
			.range(from, to)
	);
	return error ? { artworks: [], error } : { artworks: wallArtworks(rows) };
}

export async function loadArtworksByIds(ids: readonly string[]): Promise<ArtworksResult> {
	const chunks: string[][] = [];
	for (let start = 0; start < ids.length; start += CHUNK_SIZE) {
		chunks.push(ids.slice(start, start + CHUNK_SIZE));
	}
	const results = await Promise.all(chunks.map(loadChunk));
	const failed = results.find((result) => result.error);
	if (failed) return { artworks: [], error: failed.error };
	const byId = new Map(
		results.flatMap((result) => result.artworks).map((artwork) => [artwork.id, artwork])
	);
	return { artworks: ids.flatMap((id) => byId.get(id) ?? []) };
}

export async function loadRecentArtworks(): Promise<ArtworksResult> {
	const { rows, error } = await fetchAllRows((from, to) =>
		supabase
			.from('artworks')
			.select(ARTWORK_COLUMNS)
			.eq('artwork_images.position', 0)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.limit(1, { referencedTable: 'visit_artworks' })
			.range(from, Math.min(to, from + RECENT_COUNT - 1))
	);
	if (error) return { artworks: [], error };
	return { artworks: wallArtworks(rows) };
}

export async function searchArtworks(
	phrase: string,
	signal?: AbortSignal
): Promise<ArtworksResult> {
	const request = supabase.rpc('note_link_suggestions', { link_trigger: '#', phrase });
	const { data, error } = await (signal ? request.abortSignal(signal) : request);
	if (error) return { artworks: [], error: collectionErrorMessage(error) };
	const ids = (data as SuggestionRow[])
		.filter((row) => row.kind === 'artwork')
		.slice(0, SEARCH_LIMIT)
		.map((row) => row.id);
	return loadArtworksByIds(ids);
}

export async function loadArtworkNotes(ids: readonly string[]): Promise<NotesResult> {
	if (ids.length === 0) return { notes: new Map() };
	const { data, error } = await supabase
		.from('artworks')
		.select('id, notes')
		.in('id', [...ids])
		.is('deleted_at', null);
	if (error) return { notes: new Map(), error: collectionErrorMessage(error) };
	return {
		notes: new Map((data as NoteRow[]).map((row) => [row.id, row.notes ?? '']))
	};
}
