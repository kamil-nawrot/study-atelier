import { ownImageUrl, uploadOwnImage } from '#lib/images/own-image/own-image.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export type StoredImage = Exclude<ArtworkImageInput, { kind: 'file' }>;

export type ImageRow = {
	source_wikidata_id: string | null;
	source_image_file: string | null;
	source_image_licence: string | null;
	source_image_licence_url: string | null;
	source_image_attribution: string | null;
	own_image_path: string | null;
	own_image_url: string | null;
	image_width: number | null;
	image_height: number | null;
};

export const IMAGE_COLUMNS = [
	'source_wikidata_id',
	'source_image_file',
	'source_image_licence',
	'source_image_licence_url',
	'source_image_attribution',
	'own_image_path',
	'own_image_url',
	'image_width',
	'image_height'
] as const;

export function imageColumns(image: StoredImage | null): ImageRow {
	return {
		source_wikidata_id: image?.kind === 'commons' ? image.wikidataId : null,
		source_image_file: image?.kind === 'commons' ? image.file : null,
		source_image_licence: image?.kind === 'commons' ? image.licence : null,
		source_image_licence_url: image?.kind === 'commons' ? image.licenceUrl : null,
		source_image_attribution: image?.kind === 'commons' ? image.attribution : null,
		own_image_path: image?.kind === 'upload' ? image.path : null,
		own_image_url: image?.kind === 'url' ? image.url : null,
		image_width: image?.width ?? null,
		image_height: image?.height ?? null
	};
}

export function imageRecord(image: StoredImage): ImageRow & { id?: string } {
	return { ...imageColumns(image), ...(image.id ? { id: image.id } : {}) };
}

export function imageOf(row: ImageRow & { id?: string }): ArtworkImageInput | null {
	const size = { width: row.image_width, height: row.image_height };
	const id = row.id ? { id: row.id } : {};
	if (row.own_image_path) return { kind: 'upload', path: row.own_image_path, ...size, ...id };
	if (row.own_image_url) return { kind: 'url', url: row.own_image_url, ...size, ...id };
	if (row.source_wikidata_id && row.source_image_file) {
		return {
			kind: 'commons',
			wikidataId: row.source_wikidata_id,
			file: row.source_image_file,
			licence: row.source_image_licence,
			licenceUrl: row.source_image_licence_url,
			attribution: row.source_image_attribution,
			...size,
			...id
		};
	}
	return null;
}

export async function storedImage(
	image: ArtworkImageInput | null
): Promise<{ image: StoredImage | null; error?: undefined } | { error: string }> {
	if (image?.kind !== 'file') return { image };
	const upload = await uploadOwnImage(image.file);
	if (upload.error !== undefined) return { error: upload.error };
	return {
		image: {
			kind: 'upload',
			path: upload.path,
			width: image.width,
			height: image.height,
			...(image.id ? { id: image.id } : {})
		}
	};
}

export function uploadPath(image: ArtworkImageInput | null): string | null {
	return image?.kind === 'upload' ? image.path : null;
}

export async function withPreview(
	image: ArtworkImageInput | null
): Promise<ArtworkImageInput | null> {
	if (image?.kind !== 'upload') return image;
	return { ...image, previewUrl: await ownImageUrl(image.path) };
}
