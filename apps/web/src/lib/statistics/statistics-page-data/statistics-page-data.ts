import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadCollectionStatistics } from '#lib/statistics/statistics-data/statistics-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

type StatisticsPageData = {
	artworks: WallArtwork[];
	statistics?: CollectionStatistics;
	error?: string;
};

export async function loadStatistics(): Promise<StatisticsPageData> {
	const [atelier, result] = await Promise.all([loadAtelier(), loadCollectionStatistics()]);
	return {
		artworks: atelier.artworks,
		statistics: result.statistics,
		error: atelier.error ?? result.error
	};
}
