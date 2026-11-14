import {
	loadExhibition,
	loadExhibitionSummaries
} from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { loadArtworksByIds } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import { artworkIdsOf } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadSymbolOptions } from '#lib/symbols/symbols-data/symbols-data.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
import { isUuid } from '#lib/shared/utils/ids/ids.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { Exhibition } from '#lib/exhibitions/types/exhibition.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

export type ExhibitionListData = {
	exhibitions: ExhibitionSummary[];
	covers: WallArtwork[];
	error?: string;
};

export type ExhibitionPageData = {
	exhibition?: Exhibition;
	artworks: WallArtwork[];
	glossary: GlossaryTerm[];
	symbols: SymbolOption[];
	notFound?: boolean;
	error?: string;
};

export type ArchivedExhibition = ExhibitionSummary & { deletedAt: string };

export type ArchivedExhibitionsData = {
	archived: ArchivedExhibition[];
	archivedCovers: WallArtwork[];
	archivedError?: string;
};

async function summariesWithCovers(archived: boolean): Promise<{
	exhibitions: (ExhibitionSummary & { deletedAt: string | null })[];
	covers: WallArtwork[];
	error?: string;
}> {
	const { exhibitions, error } = await loadExhibitionSummaries(archived);
	if (error) return { exhibitions: [], covers: [], error };
	const coverIds = [...new Set(exhibitions.flatMap((exhibition) => exhibition.coverId ?? []))];
	const { artworks } = await loadArtworksByIds(coverIds);
	return { exhibitions, covers: artworks };
}

export async function loadExhibitionList(): Promise<ExhibitionListData> {
	const { exhibitions, covers, error } = await summariesWithCovers(false);
	return { exhibitions, covers, error };
}

export async function loadArchivedExhibitions(): Promise<ArchivedExhibitionsData> {
	const { exhibitions, covers, error } = await summariesWithCovers(true);
	return {
		archived: exhibitions.map((exhibition) => ({
			...exhibition,
			deletedAt: exhibition.deletedAt ?? exhibition.updatedAt
		})),
		archivedCovers: covers,
		archivedError: error
	};
}

export async function loadExhibitionPage(id: string): Promise<ExhibitionPageData> {
	const empty = { artworks: [], glossary: [], symbols: [] };
	if (!isUuid(id)) return { ...empty, notFound: true };
	const [result, terms, symbols] = await Promise.all([
		loadExhibition(id),
		loadTermIndex(),
		loadSymbolOptions()
	]);
	if (result.error) return { ...empty, error: result.error };
	if (!result.exhibition) return { ...empty, notFound: true };
	const { artworks } = await loadArtworksByIds(artworkIdsOf(result.exhibition.document));
	return {
		exhibition: result.exhibition,
		artworks,
		glossary: terms.terms,
		symbols: symbols.symbols
	};
}
