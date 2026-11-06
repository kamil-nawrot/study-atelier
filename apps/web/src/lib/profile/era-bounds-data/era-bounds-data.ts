import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { defaultJunctions } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { profileErrorMessage } from '#lib/profile/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

export async function saveEraBounds(junctions: readonly number[]): Promise<{ error?: string }> {
	const { error } = await supabase
		.from('profiles')
		.upsert({ era_bounds: defaultJunctions(junctions) ? null : [...junctions] });
	return error ? { error: await failureMessage(error, profileErrorMessage) } : {};
}
