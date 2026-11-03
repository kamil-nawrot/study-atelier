import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { loadCollectionStatistics } from '#lib/statistics/statistics-data/statistics-data.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

type StatisticsPageData = {
	artworks: WallArtwork[];
	statistics?: CollectionStatistics;
	ownFields?: OwnFieldDefinition[];
	error?: string;
};

export async function loadStatistics(): Promise<StatisticsPageData> {
	const [atelier, result, own] = await Promise.all([
		loadAtelier(),
		loadCollectionStatistics(),
		loadOwnFieldDefinitions()
	]);
	return {
		artworks: atelier.artworks,
		statistics: result.statistics,
		ownFields: own.error ? undefined : own.fields,
		error: atelier.error ?? result.error
	};
}
