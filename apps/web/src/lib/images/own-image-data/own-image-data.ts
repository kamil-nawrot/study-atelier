import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	IMAGES_BUCKET,
	OWN_THUMBNAIL_TYPE,
	SIGNED_URL_SECONDS,
	ownThumbnailPath
} from '#lib/images/bucket/bucket.ts';
import { ownImageErrorMessage } from '#lib/images/errors/errors.ts';
import { ownImagePath, makeThumbnail } from '#lib/images/own-image/own-image.ts';
import { quotaMessage } from '#lib/images/storage-usage-data/storage-usage-data.ts';
import type { OwnImageUpload } from '#lib/images/types/own-image-upload.ts';

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
	if (error)
		return { error: (await quotaMessage(error, file.size)) ?? ownImageErrorMessage(error) };
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

const LIST_PAGE = 1000;

export async function removeAllOwnFiles(ownerId: string): Promise<boolean> {
	for (;;) {
		const { data, error } = await supabase.storage
			.from(IMAGES_BUCKET)
			.list(ownerId, { limit: LIST_PAGE });
		if (error) return false;
		const paths = data
			.filter((entry) => Boolean(entry.id))
			.map((entry) => `${ownerId}/${entry.name}`);
		if (paths.length === 0) return true;
		const removed = await supabase.storage.from(IMAGES_BUCKET).remove(paths);
		if (removed.error) return false;
		if (data.length < LIST_PAGE) return true;
	}
}
