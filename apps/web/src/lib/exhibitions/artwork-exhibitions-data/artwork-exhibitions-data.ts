import { exhibitionErrorMessage } from '#lib/exhibitions/errors/errors.ts';
import { loadArtworksByIds } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import {
	SUMMARY_COLUMNS,
	summaryOf,
	type ExhibitionRow
} from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

export type ArtworkExhibitions = {
	exhibitions: ExhibitionSummary[];
	covers: WallArtwork[];
	error?: string;
};

export async function loadArtworkExhibitions(artworkId: string): Promise<ArtworkExhibitions> {
	const { data, error } = await supabase
		.from('exhibitions')
		.select(`${SUMMARY_COLUMNS}, holding:exhibition_artworks!inner(artwork_id)`)
		.eq('holding.artwork_id', artworkId)
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });
	if (error) return { exhibitions: [], covers: [], error: exhibitionErrorMessage(error) };
	const exhibitions = (data as unknown as ExhibitionRow[]).map(summaryOf).map((summary) => ({
		id: summary.id,
		title: summary.title,
		updatedAt: summary.updatedAt,
		artworkCount: summary.artworkCount,
		coverId: summary.coverId
	}));
	if (exhibitions.length === 0) return { exhibitions, covers: [] };
	const coverIds = [...new Set(exhibitions.flatMap((exhibition) => exhibition.coverId ?? []))];
	const covers = await loadArtworksByIds(coverIds);
	return covers.error
		? { exhibitions, covers: [], error: covers.error }
		: { exhibitions, covers: covers.artworks };
}
