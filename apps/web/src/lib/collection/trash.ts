import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { removeOwnImage } from '#lib/images/own-image.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { artworkErrorMessage } from './errors.ts';

export type TrashActionResult = {
	error?: string;
};

async function setDeletedAt(id: string, deletedAt: string | null): Promise<TrashActionResult> {
	const { error } = await supabase.from('artworks').update({ deleted_at: deletedAt }).eq('id', id);
	return error ? { error: await failureMessage(error, artworkErrorMessage) } : {};
}

export function moveToTrash(id: string, now = new Date()): Promise<TrashActionResult> {
	return setDeletedAt(id, now.toISOString());
}

export function restoreArtwork(id: string): Promise<TrashActionResult> {
	return setDeletedAt(id, null);
}

export async function deletePermanently(id: string): Promise<TrashActionResult> {
	const { data: images } = await supabase
		.from('artwork_images')
		.select('own_image_path')
		.eq('artwork_id', id);
	const { error } = await supabase.from('artworks').delete().eq('id', id);
	if (error) return { error: await failureMessage(error, artworkErrorMessage) };
	const paths = (images ?? []).map((image) => image.own_image_path);
	await Promise.all(paths.flatMap((path) => (path ? [removeOwnImage(path)] : [])));
	return {};
}
