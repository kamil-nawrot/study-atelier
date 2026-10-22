import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { fetchAll } from '#lib/collection/card-index-data.ts';
import type { Database } from '#lib/database.types.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { pinErrorMessage } from './errors.ts';
import { MAX_PIN_TEXT } from './types.ts';
import type {
	EntryPinsResult,
	Pin,
	PinActionResult,
	PinDraft,
	PinResult,
	PinsResult
} from './types.ts';

type Row = Database['public']['Tables']['artwork_pins']['Row'];

const COLUMNS = 'id, image_id, x, y, glossary_entry_id, text';
const IMAGE_BATCH = 100;

function pinOf(row: Pick<Row, 'id' | 'image_id' | 'x' | 'y' | 'glossary_entry_id' | 'text'>): Pin {
	return {
		id: row.id,
		imageId: row.image_id,
		x: row.x,
		y: row.y,
		glossaryEntryId: row.glossary_entry_id,
		text: row.text ?? ''
	};
}

function writeOf(draft: PinDraft): {
	x: number;
	y: number;
	glossary_entry_id: string | null;
	text: string | null;
} {
	const text = draft.text.trim();
	return {
		x: draft.x,
		y: draft.y,
		glossary_entry_id: draft.glossaryEntryId,
		text: text === '' ? null : text
	};
}

export function pinDraftError(draft: PinDraft): string | undefined {
	const text = draft.text.trim();
	if (draft.glossaryEntryId === null && text === '') return m.pins.errors.empty;
	if (text.length > MAX_PIN_TEXT) return m.pins.errors.tooLong(MAX_PIN_TEXT);
	return undefined;
}

export async function loadPins(imageIds: string[]): Promise<PinsResult> {
	if (imageIds.length === 0) return { pins: [] };
	const pins: Pin[] = [];
	for (let start = 0; start < imageIds.length; start += IMAGE_BATCH) {
		const batch = imageIds.slice(start, start + IMAGE_BATCH);
		const { rows, error } = await fetchAll<Row>((from, to) =>
			supabase
				.from('artwork_pins')
				.select(COLUMNS)
				.in('image_id', batch)
				.order('created_at')
				.order('id')
				.range(from, to)
		);
		if (error) return { pins: [], error: pinErrorMessage(error) };
		pins.push(...rows.map(pinOf));
	}
	return { pins };
}

export async function createPin(imageId: string, draft: PinDraft): Promise<PinResult> {
	const invalid = pinDraftError(draft);
	if (invalid) return { error: invalid };
	const { data, error } = await supabase
		.from('artwork_pins')
		.insert({ image_id: imageId, ...writeOf(draft) })
		.select(COLUMNS)
		.single();
	if (error) return { error: await failureMessage(error, pinErrorMessage) };
	return { pin: pinOf(data) };
}

export async function updatePin(id: string, draft: PinDraft): Promise<PinResult> {
	const invalid = pinDraftError(draft);
	if (invalid) return { error: invalid };
	const { data, error } = await supabase
		.from('artwork_pins')
		.update(writeOf(draft))
		.eq('id', id)
		.select(COLUMNS)
		.single();
	if (error) return { error: await failureMessage(error, pinErrorMessage) };
	return { pin: pinOf(data) };
}

export async function movePin(id: string, x: number, y: number): Promise<PinActionResult> {
	const { error } = await supabase.from('artwork_pins').update({ x, y }).eq('id', id);
	return error ? { error: await failureMessage(error, pinErrorMessage) } : {};
}

export async function deletePin(id: string): Promise<PinActionResult> {
	const { error } = await supabase.from('artwork_pins').delete().eq('id', id);
	return error ? { error: await failureMessage(error, pinErrorMessage) } : {};
}

export async function loadEntryPins(entryId: string): Promise<EntryPinsResult> {
	const { data, error } = await supabase
		.from('artwork_pins')
		.select('id, artwork_images!inner(artwork_id)')
		.eq('glossary_entry_id', entryId)
		.order('created_at')
		.order('id');
	if (error) return { pins: [], error: pinErrorMessage(error) };
	const firstPins = new Map<string, string>();
	for (const row of data) {
		const artworkId = row.artwork_images.artwork_id;
		if (!firstPins.has(artworkId)) firstPins.set(artworkId, row.id);
	}
	return { pins: [...firstPins].map(([artworkId, pinId]) => ({ artworkId, pinId })) };
}
