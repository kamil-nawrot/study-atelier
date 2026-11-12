import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { TermFragment } from '#lib/glossary/types/term-fragment.ts';
import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';

export async function termFragments(
	fragments: readonly PinFragment[],
	artworks: readonly WallArtwork[]
): Promise<TermFragment[]> {
	const shown = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	const kept = fragments.filter((fragment) => shown.has(fragment.artworkId));
	const lenses = await fragmentLenses(kept);
	return kept.flatMap((fragment) => {
		const artwork = shown.get(fragment.artworkId);
		const lens = lenses.get(fragment.pinId);
		if (!artwork || !lens) return [];
		return [
			{
				pinId: fragment.pinId,
				number: artwork.number,
				title: artwork.title,
				text: fragment.text,
				...lens
			}
		];
	});
}
