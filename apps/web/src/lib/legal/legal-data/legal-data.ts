import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { LEGAL_VERSION } from '#lib/legal/version/version.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

export const LEGAL_DEPENDENCY = 'legal:accepted';

export async function loadAcceptedLegalVersion(): Promise<string | null | undefined> {
	const { data, error } = await supabase.from('profiles').select('legal_version').maybeSingle();
	if (error) return undefined;
	return data?.legal_version ?? null;
}

export async function acceptLegal(): Promise<string | undefined> {
	const { error } = await supabase.from('profiles').upsert({ legal_version: LEGAL_VERSION });
	return error ? failureMessage(error, () => m.legal.acceptFailed) : undefined;
}
