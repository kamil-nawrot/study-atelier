import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_EXTENSIONS,
	OWN_IMAGE_MAX_BYTES,
	OWN_IMAGE_MAX_SOURCE_BYTES,
	OWN_IMAGE_MAX_SOURCE_MEGABYTES,
	OWN_IMAGE_SMALLER_QUALITY,
	OWN_IMAGE_SMALLER_SIDES,
	OWN_THUMBNAIL_QUALITY,
	OWN_THUMBNAIL_TYPE,
	OWN_THUMBNAIL_WIDTH,
	SIGNED_URL_SECONDS,
	isOwnImageType,
	ownImageFormats,
	ownThumbnailPath
} from './bucket.ts';
import { ownImageErrorMessage } from './errors.ts';

export type ImageSize = {
	width: number;
	height: number;
};

export type OwnImageUpload =
	{ path: string; error?: undefined } | { path?: undefined; error: string };

export function ownImageFileError(file: File): string | undefined {
	if (!isOwnImageType(file.type)) return m.ownImageErrors.fileType(ownImageFormats());
	if (file.size > OWN_IMAGE_MAX_SOURCE_BYTES)
		return m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_SOURCE_MEGABYTES);
	if (file.size === 0) return m.ownImageErrors.fileUnreadable;
	return undefined;
}

function urlOrNull(text: string): URL | null {
	try {
		return new URL(text);
	} catch {
		return null;
	}
}

export function parseImageUrl(text: string): { url: string } | { error: string } {
	const value = text.trim();
	if (value === '') return { error: m.ownImageErrors.urlRequired };
	const url = urlOrNull(value);
	if (url?.protocol !== 'https:' || url.hostname === '')
		return { error: m.ownImageErrors.urlInvalid };
	return { url: url.href };
}

export function readImageSize(src: string): Promise<ImageSize> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			if (image.naturalWidth > 0 && image.naturalHeight > 0) {
				resolve({ width: image.naturalWidth, height: image.naturalHeight });
			} else {
				reject(new Error('The image has no size'));
			}
		};
		image.onerror = () => reject(new Error('The image did not load'));
		image.src = src;
	});
}

export function ownImagePath(ownerId: string, file: File): string {
	const extension = isOwnImageType(file.type) ? OWN_IMAGE_EXTENSIONS[file.type] : 'img';
	return `${ownerId}/${crypto.randomUUID()}.${extension}`;
}

async function encodeJpeg(
	bitmap: ImageBitmap,
	scale: number,
	quality: number
): Promise<Blob | undefined> {
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const context = canvas.getContext('2d');
	if (!context) return undefined;
	context.fillStyle = '#ffffff';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, OWN_THUMBNAIL_TYPE, quality)
	);
	return blob?.type === OWN_THUMBNAIL_TYPE ? blob : undefined;
}

export async function cropSquareJpeg(
	source: Blob,
	side: number,
	quality: number
): Promise<Blob | undefined> {
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(source);
	} catch {
		return undefined;
	}
	try {
		const canvas = document.createElement('canvas');
		canvas.width = side;
		canvas.height = side;
		const context = canvas.getContext('2d');
		if (!context) return undefined;
		const edge = Math.min(bitmap.width, bitmap.height);
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, side, side);
		context.drawImage(
			bitmap,
			(bitmap.width - edge) / 2,
			(bitmap.height - edge) / 2,
			edge,
			edge,
			0,
			0,
			side,
			side
		);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, OWN_THUMBNAIL_TYPE, quality)
		);
		return blob?.type === OWN_THUMBNAIL_TYPE ? blob : undefined;
	} catch {
		return undefined;
	} finally {
		bitmap.close();
	}
}

export async function makeThumbnail(source: Blob): Promise<Blob | undefined> {
	try {
		const bitmap = await createImageBitmap(source);
		const scale = Math.min(1, OWN_THUMBNAIL_WIDTH / bitmap.width);
		const blob = await encodeJpeg(bitmap, scale, OWN_THUMBNAIL_QUALITY);
		bitmap.close();
		return blob;
	} catch {
		return undefined;
	}
}

function smallerFileName(name: string): string {
	const dot = name.lastIndexOf('.');
	return `${dot > 0 ? name.slice(0, dot) : name || 'image'}.jpg`;
}

export async function fitOwnImage(file: File): Promise<{ file: File } | { error: string }> {
	if (file.size <= OWN_IMAGE_MAX_BYTES) return { file };
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		return { error: m.ownImageErrors.shrinkFailed };
	}
	try {
		const longer = Math.max(bitmap.width, bitmap.height);
		for (const side of OWN_IMAGE_SMALLER_SIDES) {
			const blob = await encodeJpeg(bitmap, Math.min(1, side / longer), OWN_IMAGE_SMALLER_QUALITY);
			if (!blob) break;
			if (blob.size <= OWN_IMAGE_MAX_BYTES) {
				return { file: new File([blob], smallerFileName(file.name), { type: blob.type }) };
			}
		}
		return { error: m.ownImageErrors.shrinkFailed };
	} catch {
		return { error: m.ownImageErrors.shrinkFailed };
	} finally {
		bitmap.close();
	}
}

export async function uploadOwnThumbnail(path: string, source: Blob): Promise<boolean> {
	const thumbnail = await makeThumbnail(source);
	if (!thumbnail) return false;
	const { error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.upload(ownThumbnailPath(path), thumbnail, { contentType: OWN_THUMBNAIL_TYPE, upsert: false });
	return !error;
}

export async function uploadOwnImage(file: File): Promise<OwnImageUpload> {
	const { data } = await supabase.auth.getSession();
	const ownerId = data.session?.user.id;
	if (!ownerId) return { error: m.ownImageErrors.uploadFailed };

	const path = ownImagePath(ownerId, file);
	const { error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.upload(path, file, { contentType: file.type, upsert: false });
	if (error) return { error: ownImageErrorMessage(error) };
	await uploadOwnThumbnail(path, file);
	return { path };
}

export async function removeOwnImage(path: string): Promise<void> {
	await supabase.storage.from(IMAGES_BUCKET).remove([path, ownThumbnailPath(path)]);
}

export async function ownImageUrl(path: string): Promise<string | undefined> {
	const { data, error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.createSignedUrl(path, SIGNED_URL_SECONDS);
	if (error || !data) return undefined;
	return data.signedUrl;
}
