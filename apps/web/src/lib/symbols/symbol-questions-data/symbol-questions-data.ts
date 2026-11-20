import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { IMAGE_COLUMNS, imageOf } from '#lib/images/image-record/image-record.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { isFigure } from '#lib/glossary/categories/categories.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { symbolErrorMessage } from '#lib/symbols/errors/errors.ts';
import type { SymbolQuestionPin } from '#lib/symbols/types/symbol-question-pin.ts';

type PinRow = {
	id: string;
	x: number;
	y: number;
	text: string | null;
	view_width: number;
	crop_path: string;
	symbols: { id: string; name: string };
	symbol_meanings: {
		id: string;
		text: string;
		symbol_meaning_contexts: {
			position: number;
			glossary_entries: { name: string; category: string } | null;
		}[];
	} | null;
	artwork_images: { id: string; artwork_id: string };
};

type ImagePinRow = { id: string; artwork_images: ImageRow & { id: string } };

const COLUMNS = `id, x, y, text, view_width, crop_path, symbols!inner(id, name), symbol_meanings(id, text, symbol_meaning_contexts(position, glossary_entries(name, category))), artwork_images!inner(id, artwork_id, artworks!inner(deleted_at))`;

const IMAGE_SELECT = `id, artwork_images!inner(id, ${IMAGE_COLUMNS.join(', ')})`;

function personsOf(
	contexts: NonNullable<PinRow['symbol_meanings']>['symbol_meaning_contexts']
): string[] {
	return [...contexts]
		.sort((first, second) => first.position - second.position)
		.flatMap(({ glossary_entries: entry }) =>
			entry && isFigure(entry.category) ? [entry.name] : []
		);
}

export async function loadSymbolQuestionPins(pinIds: readonly string[]): Promise<{
	pins: SymbolQuestionPin[];
	error?: string;
}> {
	if (pinIds.length === 0) return { pins: [] };
	const { rows, error } = await fetchAll<PinRow>((from, to) =>
		supabase
			.from('artwork_pins')
			.select(COLUMNS)
			.in('id', [...pinIds])
			.not('symbol_id', 'is', null)
			.not('crop_path', 'is', null)
			.not('view_width', 'is', null)
			.is('artwork_images.artworks.deleted_at', null)
			.order('id')
			.range(from, to)
	);
	if (error) return { pins: [], error: await failureMessage(error, symbolErrorMessage) };
	return {
		pins: rows.map((row) => ({
			pinId: row.id,
			symbolId: row.symbols.id,
			symbolName: row.symbols.name,
			...(row.symbol_meanings
				? {
						meaning: {
							id: row.symbol_meanings.id,
							text: row.symbol_meanings.text,
							persons: personsOf(row.symbol_meanings.symbol_meaning_contexts)
						}
					}
				: {}),
			fragment: {
				pinId: row.id,
				symbolId: row.symbols.id,
				artworkId: row.artwork_images.artwork_id,
				x: row.x,
				y: row.y,
				viewWidth: row.view_width,
				text: row.text ?? '',
				cropPath: row.crop_path
			}
		}))
	};
}

export async function loadSymbolQuestionImages(
	pinIds: readonly string[]
): Promise<Map<string, ArtworkImageInput | null> | undefined> {
	if (pinIds.length === 0) return new Map();
	const { data, error } = await supabase
		.from('artwork_pins')
		.select(IMAGE_SELECT)
		.in('id', [...pinIds]);
	if (error) return undefined;
	return new Map(
		(data as unknown as ImagePinRow[]).map((row) => [row.id, imageOf(row.artwork_images)])
	);
}
