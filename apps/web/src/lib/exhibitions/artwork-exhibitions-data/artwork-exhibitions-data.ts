import { exhibitionErrorMessage } from '#lib/exhibitions/errors/errors.ts';
import { loadArtworksByIds } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import { summaryOf, type ExhibitionRow } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

export type ArtworkExhibitions = {
	exhibitions: ExhibitionSummary[];
	covers: WallArtwork[];
	error?: string;
};

export async function loadArtworkExhibitions(artworkId: string): Promise<ArtworkExhibitions> {
	const holding = await supabase
		.from('exhibition_artworks')
		.select('exhibition_id')
		.eq('artwork_id', artworkId);
	if (holding.error) {
		return { exhibitions: [], covers: [], error: exhibitionErrorMessage(holding.error) };
	}
	const ids = holding.data.map((row) => row.exhibition_id);
	if (ids.length === 0) return { exhibitions: [], covers: [] };
	const { data, error } = await supabase
		.from('exhibitions')
		.select('id, title, updated_at, deleted_at, exhibition_artworks(artwork_id, position)')
		.in('id', ids)
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });
	if (error) return { exhibitions: [], covers: [], error: exhibitionErrorMessage(error) };
	const exhibitions = (data as unknown as ExhibitionRow[]).map(summaryOf);
	const coverIds = [...new Set(exhibitions.flatMap((exhibition) => exhibition.coverId ?? []))];
	const { artworks } = await loadArtworksByIds(coverIds);
	return {
		exhibitions: exhibitions.map((summary) => ({
			id: summary.id,
			title: summary.title,
			updatedAt: summary.updatedAt,
			artworkCount: summary.artworkCount,
			coverId: summary.coverId
		})),
		covers: artworks
	};
}
