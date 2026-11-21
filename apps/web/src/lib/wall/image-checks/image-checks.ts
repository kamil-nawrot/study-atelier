import { ownThumbnailPath } from '#lib/images/bucket/bucket.ts';
import { checkedOwnImageUrls, ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import { backfillThumbnails } from '#lib/images/thumbnail-backfill/thumbnail-backfill.ts';
import { reportImageCheck } from '#lib/images/broken-images/broken-images.ts';
import type { MainImageRow } from '#lib/wall/types/main-image-row.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ImageCheck } from '#lib/images/types/image-check.ts';

export type ImageAnswers = {
	thumbnails: ReadonlyMap<string, string>;
	missingFiles: ReadonlySet<string>;
	urls: ReadonlyMap<string, string>;
	missingPaths: readonly string[];
};

function checkOf(artwork: WallArtwork, answers: ImageAnswers): ImageCheck | undefined {
	if (!artwork.imageId) return undefined;
	const file = artwork.pendingImage?.sourceFile;
	if (file) {
		if (answers.thumbnails.has(file))
			return check(artwork.imageId, 'source_image_file', file, false);
		if (answers.missingFiles.has(file))
			return check(artwork.imageId, 'source_image_file', file, true);
		return undefined;
	}
	const path = artwork.pendingImage?.ownPath ?? artwork.ownImagePath;
	if (!path) return undefined;
	if (answers.urls.has(path)) return check(artwork.imageId, 'own_image_path', path, false);
	if (answers.missingPaths.includes(path))
		return check(artwork.imageId, 'own_image_path', path, true);
	return undefined;
}

function check(
	id: string,
	column: ImageCheck['column'],
	value: string,
	broken: boolean
): ImageCheck {
	return { id, column, value, broken };
}

export function imageChecks(
	artworks: readonly WallArtwork[],
	answers: ImageAnswers
): { check: ImageCheck; wasBroken: boolean }[] {
	return artworks.flatMap((artwork) => {
		const found = checkOf(artwork, answers);
		return found ? [{ check: found, wasBroken: artwork.imageBroken === true }] : [];
	});
}

export async function wallImageUrls(
	paths: string[]
): Promise<{ urls: Map<string, string>; missing: string[] }> {
	const thumbnails = await ownImageUrls(paths.map(ownThumbnailPath));
	const urls = new Map<string, string>();
	const withoutThumbnail: string[] = [];
	for (const path of paths) {
		const thumbnail = thumbnails.get(ownThumbnailPath(path));
		if (thumbnail) urls.set(path, thumbnail);
		else withoutThumbnail.push(path);
	}
	const originals = await checkedOwnImageUrls(withoutThumbnail);
	for (const [path, url] of originals.urls) urls.set(path, url);
	backfillThumbnails(originals.urls);
	return { urls, missing: originals.missing };
}

export function mainImageState(
	main: MainImageRow | undefined
): Pick<WallArtwork, 'imageId' | 'imageBroken'> {
	return {
		...(main?.id ? { imageId: main.id } : {}),
		...(main?.broken_at ? { imageBroken: true } : {})
	};
}

export function reportChecks(artworks: WallArtwork[], answers: ImageAnswers): void {
	for (const { check, wasBroken } of imageChecks(artworks, answers))
		reportImageCheck(check, wasBroken);
}
