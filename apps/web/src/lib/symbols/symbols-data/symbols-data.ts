import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { IMAGE_COLUMNS, imageOf } from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { isUuid } from '#lib/shared/utils/ids/ids.ts';
import { isNameTakenError, symbolErrorMessage } from '#lib/symbols/errors/errors.ts';
import {
	contextOf,
	contextWrite,
	type ContextRow
} from '#lib/symbols/symbol-contexts/symbol-contexts.ts';
import type { AtlasSymbol } from '#lib/symbols/types/atlas-symbol.ts';
import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';
import type { SymbolDraft } from '#lib/symbols/types/symbol-draft.ts';
import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';
import type { SymbolPin } from '#lib/symbols/types/symbol-pin.ts';

type AtlasResult = { symbols: AtlasSymbol[]; error?: string };
type SymbolResult = { symbol?: SymbolEntry; notFound?: boolean; error?: string };
type SymbolPinsResult = { pins: SymbolPin[]; error?: string };
type SaveResult = { id?: string; nameTaken?: boolean; error?: string };
type DeleteResult = { error?: string };

type CoverRow = ImageRow & {
	pin_id: string;
	artwork_id: string;
	image_id: string;
	x: number;
	y: number;
	view_width: number;
	crop_path: string | null;
};

type MeaningRow = {
	id: string;
	position: number;
	text: string;
	symbol_meaning_contexts: ContextRow[];
};

type SymbolRow = { id: string; name: string; symbol_meanings: MeaningRow[] };

type PinRow = {
	id: string;
	x: number;
	y: number;
	text: string | null;
	view_width: number | null;
	crop_path: string | null;
	symbol_meaning_id: string | null;
	artwork_images: ImageRow & { id: string; artwork_id: string };
};

const CONTEXT_COLUMNS =
	'position, value_id, era_code, artwork_id, glossary_entry_id, text, category_values(category_code, name), artworks(record_number, title), glossary_entries(name)';

const SYMBOL_COLUMNS = `id, name, symbol_meanings(id, position, text, symbol_meaning_contexts(${CONTEXT_COLUMNS}))`;

const PIN_COLUMNS = `id, x, y, text, view_width, crop_path, symbol_meaning_id, artwork_images!inner(id, artwork_id, ${IMAGE_COLUMNS.join(', ')})`;

function coverOf(cover: Json | null): PinFragment | undefined {
	if (!cover || typeof cover !== 'object' || Array.isArray(cover)) return undefined;
	const row = cover as unknown as CoverRow;
	return {
		pinId: row.pin_id,
		artworkId: row.artwork_id,
		x: row.x,
		y: row.y,
		viewWidth: row.view_width,
		text: '',
		image: imageOf({ ...row, id: row.image_id }),
		...(row.crop_path ? { cropPath: row.crop_path } : {})
	};
}

export async function loadSymbolAtlas(): Promise<AtlasResult> {
	const { data, error } = await supabase.rpc('symbol_atlas');
	if (error) return { symbols: [], error: await failureMessage(error, symbolErrorMessage) };
	const covers = new Map(data.map((row) => [row.id, coverOf(row.cover)]));
	const lenses = await fragmentLenses(
		[...covers.values()].filter((cover): cover is PinFragment => cover !== undefined)
	);
	return {
		symbols: data.map((row) => {
			const cover = covers.get(row.id);
			const lens = cover ? lenses.get(cover.pinId) : undefined;
			return {
				id: row.id,
				name: row.name,
				createdAt: row.created_at,
				...(row.first_meaning ? { firstMeaning: row.first_meaning } : {}),
				meaningCount: row.meaning_count,
				pinCount: row.pin_count,
				...(lens ? { cover: lens } : {})
			};
		})
	};
}

function entryOf(row: SymbolRow): SymbolEntry {
	return {
		id: row.id,
		name: row.name,
		meanings: [...row.symbol_meanings]
			.sort((a, b) => a.position - b.position)
			.map((meaning) => ({
				id: meaning.id,
				text: meaning.text,
				contexts: [...meaning.symbol_meaning_contexts]
					.sort((a, b) => a.position - b.position)
					.map(contextOf)
			}))
	};
}

export async function loadSymbol(id: string): Promise<SymbolResult> {
	if (!isUuid(id)) return { notFound: true };
	const { data, error } = await supabase
		.from('symbols')
		.select(SYMBOL_COLUMNS)
		.eq('id', id)
		.maybeSingle();
	if (error) return { error: await failureMessage(error, symbolErrorMessage) };
	return data ? { symbol: entryOf(data as unknown as SymbolRow) } : { notFound: true };
}

function pinOf(row: PinRow): SymbolPin {
	const artworkId = row.artwork_images.artwork_id;
	const fragment: PinFragment | undefined =
		row.view_width === null
			? undefined
			: {
					pinId: row.id,
					artworkId,
					x: row.x,
					y: row.y,
					viewWidth: row.view_width,
					text: row.text ?? '',
					image: imageOf(row.artwork_images),
					...(row.crop_path ? { cropPath: row.crop_path } : {})
				};
	return {
		pinId: row.id,
		artworkId,
		meaningId: row.symbol_meaning_id,
		...(fragment ? { fragment } : {})
	};
}

export async function loadSymbolPins(symbolId: string): Promise<SymbolPinsResult> {
	const { data, error } = await supabase
		.from('artwork_pins')
		.select(PIN_COLUMNS)
		.eq('symbol_id', symbolId)
		.order('created_at')
		.order('id');
	if (error) return { pins: [], error: await failureMessage(error, symbolErrorMessage) };
	return { pins: (data as unknown as PinRow[]).map(pinOf) };
}

export async function saveSymbol(draft: SymbolDraft, existingId?: string): Promise<SaveResult> {
	const meanings = draft.meanings.map((meaning) => ({
		...(meaning.id ? { id: meaning.id } : {}),
		text: meaning.text.trim(),
		contexts: meaning.contexts.map(contextWrite)
	}));
	const { data, error } = await supabase.rpc('save_symbol', {
		new_name: draft.name.trim(),
		new_meanings: meanings,
		...(existingId ? { symbol_id: existingId } : {})
	});
	if (error) {
		if (isNameTakenError(error)) return { nameTaken: true };
		return { error: await failureMessage(error, symbolErrorMessage) };
	}
	return { id: data };
}

export async function deleteSymbol(id: string): Promise<DeleteResult> {
	const { error } = await supabase.from('symbols').delete().eq('id', id);
	return error ? { error: await failureMessage(error, symbolErrorMessage) } : {};
}

type ArtworkSuggestionRow = { kind: string; id: string; record_number: number; title: string };

export async function searchArtworkContexts(
	phrase: string,
	signal?: AbortSignal
): Promise<SymbolContext[]> {
	const request = supabase.rpc('note_link_suggestions', { link_trigger: '#', phrase });
	const { data, error } = await (signal ? request.abortSignal(signal) : request);
	if (error) return [];
	return (data as ArtworkSuggestionRow[])
		.filter((row) => row.kind === 'artwork')
		.map((row) => ({
			kind: 'artwork',
			artworkId: row.id,
			number: row.record_number,
			name: row.title
		}));
}
