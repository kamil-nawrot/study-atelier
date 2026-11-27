import { MAX_ARTWORK_IMAGES } from '#lib/artworks/artwork-form/artwork-form.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';

type ImageChanges = Pick<MergeChanges, 'images' | 'droppedImages'>;

export function imagesOf(side: ComparedSide): ArtworkImageInput[] {
	return [side.image, ...side.images].filter((image) => image !== null);
}

export function ownImageKey(image: ArtworkImageInput, index: number): string {
	return image.id ?? `#${index}`;
}

function albumPath(image: ArtworkImageInput): string | null {
	return image.kind === 'album' ? image.path : null;
}

export function hasImage(mine: ComparedSide, path: string): boolean {
	return imagesOf(mine).some((image) => albumPath(image) === path);
}

export function offeredImages(mine: ComparedSide, album: ComparedSide): ArtworkImageInput[] {
	return imagesOf(album).filter((image) => {
		const path = albumPath(image);
		return path !== null && !hasImage(mine, path);
	});
}

export function keptOwnImages(mine: ComparedSide, changes: ImageChanges): ArtworkImageInput[] {
	return imagesOf(mine).filter(
		(image, index) => !changes.droppedImages.includes(ownImageKey(image, index))
	);
}

export function keptCount(mine: ComparedSide, changes: ImageChanges): number {
	return keptOwnImages(mine, changes).length + changes.images.length;
}

export function imageSelectable(mine: ComparedSide, changes: ImageChanges, path: string): boolean {
	return changes.images.includes(path) || keptCount(mine, changes) < MAX_ARTWORK_IMAGES;
}

export function ownImageSelectable(
	mine: ComparedSide,
	changes: ImageChanges,
	key: string
): boolean {
	return !changes.droppedImages.includes(key) || keptCount(mine, changes) < MAX_ARTWORK_IMAGES;
}

export function initialImages(mine: ComparedSide, album: ComparedSide): string[] {
	if (imagesOf(mine).length > 0) return [];
	return offeredImages(mine, album)
		.slice(0, MAX_ARTWORK_IMAGES)
		.flatMap((image) => (image.kind === 'album' ? [image.path] : []));
}

export function mergedImages(
	mine: ComparedSide,
	album: ComparedSide,
	changes: ImageChanges
): Pick<ComparedSide, 'image' | 'images'> {
	const attached = offeredImages(mine, album).filter((image) =>
		changes.images.includes(albumPath(image) ?? '')
	);
	const [image = null, ...images] = [...keptOwnImages(mine, changes), ...attached];
	return { image, images };
}
