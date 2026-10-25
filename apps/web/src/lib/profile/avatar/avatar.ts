import { m } from '#lib/i18n/i18n.ts';
import { cropSquareJpeg, ownImageFileError } from '#lib/images/own-image/own-image.ts';
import { ownImageUrl } from '#lib/images/own-image-data/own-image-data.ts';

export const AVATAR_SIDE = 256;
export const AVATAR_QUALITY = 0.9;

const URL_LIFETIME_MS = 50 * 60 * 1000;

const signedUrls = new Map<string, { url: string; expires: number }>();

export function avatarPathOf(ownerId: string): string {
	return `${ownerId}/avatar-${crypto.randomUUID()}.jpg`;
}

export async function cropAvatar(file: File): Promise<{ image: Blob } | { error: string }> {
	const fileError = ownImageFileError(file);
	if (fileError) return { error: fileError };
	const image = await cropSquareJpeg(file, AVATAR_SIDE, AVATAR_QUALITY);
	return image ? { image } : { error: m.ownImageErrors.shrinkFailed };
}

export async function avatarUrl(path: string): Promise<string | undefined> {
	const known = signedUrls.get(path);
	if (known && known.expires > Date.now()) return known.url;
	const url = await ownImageUrl(path);
	if (url) signedUrls.set(path, { url, expires: Date.now() + URL_LIFETIME_MS });
	return url;
}
