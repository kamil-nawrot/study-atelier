import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { flagErrorMessage } from '#lib/backroom/errors/errors.ts';
import { flagPayload, type FlagPayload } from '#lib/backroom/flag-payload/flag-payload.ts';
import type { FlagDraft } from '#lib/backroom/types/flag-draft.ts';
import type { FlagPin } from '#lib/backroom/types/flag-pin.ts';
import type { RestorableFlag } from '#lib/backroom/types/restorable-flag.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

const PLACE_TOLERANCE = 1e-9;

export type FlagSaveResult = { created: boolean; error?: undefined } | { error: string };

async function pinIdAt(pin: FlagPin): Promise<string | undefined> {
	const { data } = await supabase
		.from('artwork_pins')
		.select('id')
		.eq('image_id', pin.imageId)
		.gte('x', pin.x - PLACE_TOLERANCE)
		.lte('x', pin.x + PLACE_TOLERANCE)
		.gte('y', pin.y - PLACE_TOLERANCE)
		.lte('y', pin.y + PLACE_TOLERANCE)
		.limit(1)
		.maybeSingle();
	return data?.id;
}

async function withPinId(draft: FlagDraft): Promise<FlagDraft> {
	const { item } = draft;
	if (draft.reason !== 'pin' || item.kind !== 'artwork' || !item.pin || item.pin.id) return draft;
	const id = await pinIdAt(item.pin);
	return id ? { ...draft, item: { ...item, pin: { ...item.pin, id } } } : draft;
}

export async function saveFlag(draft: FlagDraft): Promise<FlagSaveResult> {
	const payload = flagPayload(await withPinId(draft));
	const { data, error } = await supabase.rpc('save_flag', { flag: payload as unknown as Json });
	if (error) return { error: await failureMessage(error, flagErrorMessage) };
	return { created: data === true };
}

export async function restoreFlag(flag: RestorableFlag): Promise<{ error?: string }> {
	const payload: FlagPayload = {
		...(flag.artworkId ? { artwork_id: flag.artworkId } : {}),
		...(flag.termId ? { term_id: flag.termId } : {}),
		...(flag.symbolId ? { symbol_id: flag.symbolId } : {}),
		...(flag.eventId ? { event_id: flag.eventId } : {}),
		...(flag.imageId ? { image_id: flag.imageId } : {}),
		...(flag.pinId ? { pin_id: flag.pinId } : {}),
		reason: flag.reason,
		comment: flag.comment,
		...(flag.question ? { question: flag.question } : {}),
		holds: flag.holds
	};
	const { error } = await supabase.rpc('save_flag', { flag: payload as unknown as Json });
	return error ? { error: await failureMessage(error, flagErrorMessage) } : {};
}
