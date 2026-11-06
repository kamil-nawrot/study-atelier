import { sidesOf } from '#lib/compare/compare-address/compare-address.ts';
import { loadComparison } from '#lib/compare/compare-load/compare-load.ts';
import type { ComparedArtworks } from '#lib/compare/types/compared-artworks.ts';
import type { CompareSides } from '#lib/compare/types/compare-sides.ts';
import type { PageLoad } from './$types';

type CompareData = ComparedArtworks & { sides: CompareSides };

export const load: PageLoad = async ({ url }): Promise<CompareData> => {
	const sides = sidesOf(url.searchParams);
	return { sides, ...(await loadComparison(sides)) };
};
