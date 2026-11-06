import { artworkCore } from '#lib/artworks/artwork-preload/artwork-preload.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { CompareSides } from '#lib/compare/types/compare-sides.ts';
import type { ComparedArtworks } from '#lib/compare/types/compared-artworks.ts';

async function artworkAt(
	number: number | null
): Promise<{ artwork?: ArtworkRecord; error?: string }> {
	if (number === null) return {};
	const result = await artworkCore(number);
	if (result.artwork) return { artwork: result.artwork };
	return result.notFound ? {} : { error: result.error };
}

export async function loadComparison(sides: CompareSides): Promise<ComparedArtworks> {
	const [left, right] = await Promise.all([artworkAt(sides.left), artworkAt(sides.right)]);
	return {
		left: left.artwork,
		right: right.artwork,
		error: left.error ?? right.error
	};
}
