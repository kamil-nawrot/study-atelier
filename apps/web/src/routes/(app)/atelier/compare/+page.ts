import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { albumEntryOf, sidesOf } from '#lib/compare/compare-address/compare-address.ts';
import { loadAlbumComparison, loadComparison } from '#lib/compare/compare-load/compare-load.ts';
import type { AlbumComparison } from '#lib/compare/types/album-comparison.ts';
import type { ComparedArtworks } from '#lib/compare/types/compared-artworks.ts';
import type { CompareSides } from '#lib/compare/types/compare-sides.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { PageLoad } from './$types';

type CompareData = ComparedArtworks & {
	sides: CompareSides;
	ownFields: OwnFieldDefinition[];
	album?: AlbumComparison;
};

export const load: PageLoad = async ({ url, fetch }): Promise<CompareData> => {
	const sides = sidesOf(url.searchParams);
	const entry = albumEntryOf(url.searchParams);
	const [own, compared] = await Promise.all([
		loadOwnFieldDefinitions(),
		entry
			? loadAlbumComparison(sides.left, entry, fetch).then((album) => ({ album }))
			: loadComparison(sides)
	]);
	return { sides, ownFields: own.fields, ...compared };
};
