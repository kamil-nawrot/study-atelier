import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
import { ownThumbnailPath } from '#lib/images/bucket/bucket.ts';
import { ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { FragmentThumbnail } from '#lib/glossary/types/fragment-thumbnail.ts';
import type { TermFragment } from '#lib/glossary/types/term-fragment.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';

const THUMBNAIL_WIDTH = 320;

function thumbnailPath(fragment: PinFragment): string | undefined {
	return fragment.image?.kind === 'upload' ? ownThumbnailPath(fragment.image.path) : undefined;
}

function thumbnailOf(fragment: PinFragment, urls: Map<string, string>): FragmentThumbnail {
	const path = thumbnailPath(fragment);
	const src = path ? urls.get(path) : artworkImageSource(fragment.image, THUMBNAIL_WIDTH)?.src;
	const width = fragment.image?.width;
	const height = fragment.image?.height;
	return {
		...(src ? { src } : {}),
		x: fragment.x,
		y: fragment.y,
		ratio: width && height ? width / height : 1
	};
}

export async function termFragments(
	fragments: readonly PinFragment[],
	artworks: readonly WallArtwork[]
): Promise<TermFragment[]> {
	const shown = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	const kept = fragments.filter((fragment) => shown.has(fragment.artworkId));
	const paths = kept
		.flatMap((fragment) => [fragment.cropPath, thumbnailPath(fragment)])
		.filter((path): path is string => path !== undefined);
	const urls = await ownImageUrls(paths);
	return kept.flatMap((fragment) => {
		const artwork = shown.get(fragment.artworkId);
		if (!artwork) return [];
		const crop = fragment.cropPath ? urls.get(fragment.cropPath) : undefined;
		return [
			{
				pinId: fragment.pinId,
				number: artwork.number,
				title: artwork.title,
				text: fragment.text,
				...(crop ? { crop } : {}),
				thumbnail: thumbnailOf(fragment, urls)
			}
		];
	});
}
