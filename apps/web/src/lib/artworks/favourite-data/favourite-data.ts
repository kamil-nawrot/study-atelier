import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

export type FavouriteResult = {
	error?: string;
};

export async function setFavourite(id: string, favourite: boolean): Promise<FavouriteResult> {
	const { error } = await supabase.from('artworks').update({ favourite }).eq('id', id);
	return error ? { error: await failureMessage(error, () => m.favourite.failed) } : {};
}
