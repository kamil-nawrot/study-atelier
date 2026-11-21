import { saveImageCheck } from '#lib/images/broken-images-data/broken-images-data.ts';
import type { ImageCheck } from '#lib/images/types/image-check.ts';
import { COMMONS_THUMBNAIL_WIDTHS, fetchCommonsThumbnails } from '#lib/images/commons/commons.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

const reported = new Map<string, boolean>();

function online(): boolean {
	return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export function reportImageCheck(image: ImageCheck, wasBroken: boolean): void {
	if (image.broken === wasBroken) return;
	if (image.broken && !online()) return;
	const key = `${image.id}:${image.column}:${image.value}`;
	if (reported.get(key) === image.broken) return;
	reported.set(key, image.broken);
	void saveImageCheck(image);
}

export function forgetReportedImages(): void {
	reported.clear();
}

type CommonsImage = Extract<ArtworkImageInput, { kind: 'commons' }> & { id: string };

function isCommons(image: ArtworkImageInput | null): image is CommonsImage {
	return image?.kind === 'commons' && image.id !== undefined;
}

export async function checkCommonsImages(
	images: readonly (ArtworkImageInput | null)[]
): Promise<void> {
	const commons = images.filter(isCommons);
	if (commons.length === 0) return;
	const missing = new Set<string>();
	const thumbnails = await fetchCommonsThumbnails(
		commons.map((image) => image.file),
		COMMONS_THUMBNAIL_WIDTHS[0],
		missing
	);
	for (const image of commons) {
		const broken = missing.has(image.file);
		if (!broken && !thumbnails.has(image.file)) continue;
		reportImageCheck(
			{ id: image.id, column: 'source_image_file', value: image.file, broken },
			image.broken === true
		);
	}
}
