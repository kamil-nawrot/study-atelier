import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { cacheKeys, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

export async function setWantToSee(id: string, wantToSee: boolean): Promise<{ error?: string }> {
	const { error } = await supabase.from('artworks').update({ want_to_see: wantToSee }).eq('id', id);
	forgetCached([cacheKeys.atelier]);
	return error ? { error: await failureMessage(error, () => m.favourite.failed) } : {};
}
