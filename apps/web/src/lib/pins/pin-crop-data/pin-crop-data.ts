import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_CACHE_SECONDS,
	OWN_THUMBNAIL_TYPE
} from '#lib/images/bucket/bucket.ts';
import type { Pin } from '#lib/pins/types/pin.ts';

const SAME_PLACE_TOLERANCE = 1e-9;

export function pinCropPath(ownerId: string, pinId: string): string {
	return `${ownerId}/${pinId}-crop-${crypto.randomUUID().slice(0, 8)}.jpg`;
}

export async function savePinCrop(pin: Pin, crop: Blob): Promise<boolean> {
	const { data } = await supabase.auth.getSession();
	const ownerId = data.session?.user.id;
	if (!ownerId || pin.viewWidth === undefined) return false;
	const path = pinCropPath(ownerId, pin.id);
	const upload = await supabase.storage.from(IMAGES_BUCKET).upload(path, crop, {
		contentType: OWN_THUMBNAIL_TYPE,
		cacheControl: String(OWN_IMAGE_CACHE_SECONDS),
		upsert: false
	});
	if (upload.error) return false;
	const { error } = await supabase
		.from('artwork_pins')
		.update({ crop_path: path })
		.eq('id', pin.id)
		.gte('x', pin.x - SAME_PLACE_TOLERANCE)
		.lte('x', pin.x + SAME_PLACE_TOLERANCE)
		.gte('y', pin.y - SAME_PLACE_TOLERANCE)
		.lte('y', pin.y + SAME_PLACE_TOLERANCE)
		.gte('view_width', pin.viewWidth - SAME_PLACE_TOLERANCE)
		.lte('view_width', pin.viewWidth + SAME_PLACE_TOLERANCE);
	return !error;
}
