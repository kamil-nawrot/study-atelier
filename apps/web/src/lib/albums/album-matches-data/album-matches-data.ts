import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { AtelierMatch } from '#lib/albums/types/atelier-match.ts';
import type { AtelierMatchQuery } from '#lib/albums/types/atelier-match-query.ts';

type MatchRow = { id: string; record_number: number; title: string; album_entry: string | null };

type ImageRow = { source_wikidata_id: string; artworks: MatchRow };

const MATCH_COLUMNS = 'id, record_number, title, album_entry';

export function titlePattern(title: string): string {
	return `"${title.trim().replace(/["\\]/g, '_')}"`;
}

export function artworkFilter(query: AtelierMatchQuery): string {
	return [
		...query.slugs.map((slug) => `album_entry.like.${slug}/*`),
		...query.titles
			.filter((title) => title.trim() !== '')
			.map((title) => `title.ilike.${titlePattern(title)}`)
	].join(',');
}

function fetchArtworks(query: AtelierMatchQuery): ReturnType<typeof fetchAll<MatchRow>> {
	const filter = artworkFilter(query);
	if (filter === '') return Promise.resolve({ rows: [] });
	return fetchAll<MatchRow>((from, to) =>
		supabase
			.from('artworks')
			.select(MATCH_COLUMNS)
			.is('deleted_at', null)
			.or(filter)
			.order('record_number')
			.range(from, to)
	);
}

function fetchImages(wikidataIds: string[]): ReturnType<typeof fetchAll<ImageRow>> {
	if (wikidataIds.length === 0) return Promise.resolve({ rows: [] });
	return fetchAll<ImageRow>((from, to) =>
		supabase
			.from('artwork_images')
			.select(`source_wikidata_id, artworks!inner(${MATCH_COLUMNS})`)
			.in('source_wikidata_id', wikidataIds)
			.is('artworks.deleted_at', null)
			.order('id')
			.range(from, to)
	);
}

function merged(artworks: MatchRow[], images: ImageRow[]): AtelierMatch[] {
	const matches = new Map<string, AtelierMatch>();
	const add = (row: MatchRow): AtelierMatch => {
		const known = matches.get(row.id);
		if (known) return known;
		const match = {
			id: row.id,
			number: row.record_number,
			title: row.title,
			albumEntry: row.album_entry,
			wikidataIds: []
		};
		matches.set(row.id, match);
		return match;
	};
	artworks.forEach(add);
	for (const image of images) {
		const match = add(image.artworks);
		if (!match.wikidataIds.includes(image.source_wikidata_id)) {
			match.wikidataIds.push(image.source_wikidata_id);
		}
	}
	return [...matches.values()].sort((a, b) => a.number - b.number);
}

export async function loadAtelierMatches(
	query: AtelierMatchQuery
): Promise<{ matches: AtelierMatch[]; error?: string }> {
	const [artworks, images] = await Promise.all([
		fetchArtworks(query),
		fetchImages(query.wikidataIds)
	]);
	const error = artworks.error ?? images.error;
	if (error) return { matches: [], error: collectionErrorMessage(error) };
	return { matches: merged(artworks.rows, images.rows) };
}
