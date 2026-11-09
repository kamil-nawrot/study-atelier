import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

function numberQuery(term: string): number | null {
	const digits = term.replace(/^#/, '');
	return /^\d+$/.test(digits) ? Number(digits) : null;
}

export function filterForComparison(
	artworks: readonly WallArtwork[],
	query: string,
	except: readonly (number | null)[] = []
): WallArtwork[] {
	const term = normalizeForSearch(query);
	const number = numberQuery(term);
	return artworks.filter((artwork) => {
		if (except.includes(artwork.number)) return false;
		if (term === '') return true;
		if (number !== null && artwork.number === number) return true;
		return [artwork.title, ...artwork.authors].some((text) =>
			normalizeForSearch(text).includes(term)
		);
	});
}
