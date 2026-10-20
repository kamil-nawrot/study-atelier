import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';

export type FavouriteResult = {
	error?: string;
};

export async function setFavourite(id: string, favourite: boolean): Promise<FavouriteResult> {
	const { error } = await supabase.from('artworks').update({ favourite }).eq('id', id);
	return error ? { error: await failureMessage(error, () => m.favourite.failed) } : {};
}

export function favouriteLabel(favourite: boolean): string {
	return favourite ? m.favourite.remove : m.favourite.add;
}

export function favouriteToast(favourite: boolean): string {
	return favourite ? m.favourite.added : m.favourite.removed;
}
