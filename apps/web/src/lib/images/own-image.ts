import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_EXTENSIONS,
	OWN_IMAGE_MAX_BYTES,
	OWN_IMAGE_MAX_MEGABYTES,
	isOwnImageType,
	ownImageFormats
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
	if (file.size > OWN_IMAGE_MAX_BYTES)
		return m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_MEGABYTES);
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

export async function uploadOwnImage(file: File): Promise<OwnImageUpload> {
	const { data } = await supabase.auth.getSession();
	const ownerId = data.session?.user.id;
	if (!ownerId) return { error: m.ownImageErrors.uploadFailed };

	const path = ownImagePath(ownerId, file);
	const { error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.upload(path, file, { contentType: file.type, upsert: false });
	if (error) return { error: ownImageErrorMessage(error) };
	return { path };
}

export async function removeOwnImage(path: string): Promise<void> {
	await supabase.storage.from(IMAGES_BUCKET).remove([path]);
}
