import { removeOwnImage } from '#lib/images/own-image.ts';
import { supabase } from '#lib/supabase.ts';
import { artworkErrorMessage } from './errors.ts';

export type TrashActionResult = {
	error?: string;
};

async function setDeletedAt(id: string, deletedAt: string | null): Promise<TrashActionResult> {
	const { error } = await supabase.from('artworks').update({ deleted_at: deletedAt }).eq('id', id);
	return error ? { error: artworkErrorMessage(error) } : {};
}

export function moveToTrash(id: string, now = new Date()): Promise<TrashActionResult> {
	return setDeletedAt(id, now.toISOString());
}

export function restoreArtwork(id: string): Promise<TrashActionResult> {
	return setDeletedAt(id, null);
}

export async function deletePermanently(
	id: string,
	ownImagePath: string | null
): Promise<TrashActionResult> {
	const { error } = await supabase.from('artworks').delete().eq('id', id);
	if (error) return { error: artworkErrorMessage(error) };
	if (ownImagePath) await removeOwnImage(ownImagePath);
	return {};
}
