import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import type { Database } from '#lib/shared/data/database.types.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { pinErrorMessage } from '#lib/pins/errors/errors.ts';
import { MAX_PIN_TEXT } from '#lib/pins/pin-limits/pin-limits.ts';
import type { Pin } from '#lib/pins/types/pin.ts';
import type { EntryPin } from '#lib/pins/types/entry-pin.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';
import { IMAGE_COLUMNS, imageOf } from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';

type PinDraft = {
	x: number;
	y: number;
	glossaryEntryId: string | null;
	symbolId?: string | null;
	symbolMeaningId?: string | null;
	text: string;
	viewWidth?: number;
};

type PinsResult = {
	pins: Pin[];
	error?: string;
};

type PinResult = {
	pin?: Pin;
	error?: string;
};

type PinActionResult = {
	error?: string;
};

type EntryPinsResult = {
	pins: EntryPin[];
	fragments: PinFragment[];
	error?: string;
};

type EntryPinRow = Pick<Row, 'id' | 'x' | 'y' | 'text' | 'view_width' | 'crop_path'> & {
	artwork_images: ImageRow & { id: string; artwork_id: string };
};

const ENTRY_PIN_COLUMNS = `id, x, y, text, view_width, crop_path, artwork_images!inner(id, artwork_id, ${IMAGE_COLUMNS.join(', ')})`;

type Row = Database['public']['Tables']['artwork_pins']['Row'];

const COLUMNS =
	'id, image_id, x, y, glossary_entry_id, symbol_id, symbol_meaning_id, text, view_width, crop_path';

function pinOf(
	row: Pick<
		Row,
		| 'id'
		| 'image_id'
		| 'x'
		| 'y'
		| 'glossary_entry_id'
		| 'symbol_id'
		| 'symbol_meaning_id'
		| 'text'
		| 'view_width'
		| 'crop_path'
	>
): Pin {
	return {
		id: row.id,
		imageId: row.image_id,
		x: row.x,
		y: row.y,
		glossaryEntryId: row.glossary_entry_id,
		text: row.text ?? '',
		...(row.symbol_id ? { symbolId: row.symbol_id } : {}),
		...(row.symbol_meaning_id ? { symbolMeaningId: row.symbol_meaning_id } : {}),
		...(row.view_width ? { viewWidth: row.view_width } : {}),
		...(row.crop_path ? { cropPath: row.crop_path } : {})
	};
}

function writeOf(draft: PinDraft): {
	x: number;
	y: number;
	glossary_entry_id: string | null;
	symbol_id: string | null;
	symbol_meaning_id: string | null;
	text: string | null;
	view_width: number | null;
} {
	const text = draft.text.trim();
	return {
		x: draft.x,
		y: draft.y,
		glossary_entry_id: draft.glossaryEntryId,
		symbol_id: draft.symbolId ?? null,
		symbol_meaning_id: draft.symbolId ? (draft.symbolMeaningId ?? null) : null,
		text: text === '' ? null : text,
		view_width: draft.viewWidth ?? null
	};
}

export function pinDraftError(draft: PinDraft): string | undefined {
	const text = draft.text.trim();
	if (
		draft.glossaryEntryId === null &&
		!draft.symbolId &&
		text === '' &&
		draft.viewWidth === undefined
	) {
		return m.pins.errors.empty;
	}
	if (text.length > MAX_PIN_TEXT) return m.pins.errors.tooLong(MAX_PIN_TEXT);
	return undefined;
}

export async function countTermPins(): Promise<number | undefined> {
	const { count, error } = await supabase
		.from('artwork_pins')
		.select('id', { count: 'exact', head: true })
		.not('glossary_entry_id', 'is', null);
	return error ? undefined : (count ?? 0);
}

export async function loadArtworkPins(recordNumber: number): Promise<PinsResult> {
	const { rows, error } = await fetchAll<Row>((from, to) =>
		supabase
			.from('artwork_pins')
			.select(`${COLUMNS}, artwork_images!inner(artworks!inner(record_number))`)
			.eq('artwork_images.artworks.record_number', recordNumber)
			.order('created_at')
			.order('id')
			.range(from, to)
	);
	if (error) return { pins: [], error: pinErrorMessage(error) };
	return { pins: rows.map(pinOf) };
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
		.select(ENTRY_PIN_COLUMNS)
		.eq('glossary_entry_id', entryId)
		.order('created_at')
		.order('id');
	if (error) return { pins: [], fragments: [], error: pinErrorMessage(error) };
	const firstPins = new Map<string, string>();
	const fragments: PinFragment[] = [];
	for (const row of data as unknown as EntryPinRow[]) {
		const artworkId = row.artwork_images.artwork_id;
		if (!firstPins.has(artworkId)) firstPins.set(artworkId, row.id);
		if (row.view_width === null) continue;
		fragments.push({
			pinId: row.id,
			artworkId,
			x: row.x,
			y: row.y,
			viewWidth: row.view_width,
			text: row.text ?? '',
			image: imageOf(row.artwork_images),
			...(row.crop_path ? { cropPath: row.crop_path } : {})
		});
	}
	return {
		pins: [...firstPins].map(([artworkId, pinId]) => ({ artworkId, pinId })),
		fragments
	};
}
