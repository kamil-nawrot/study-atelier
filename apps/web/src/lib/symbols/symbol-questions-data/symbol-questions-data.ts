import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { IMAGE_COLUMNS, imageOf } from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
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
	symbols: { name: string };
	symbol_meanings: {
		id: string;
		text: string;
		symbol_meaning_contexts: {
			position: number;
			glossary_entries: { name: string; category: string } | null;
		}[];
	} | null;
	artwork_images: ImageRow & { id: string; artwork_id: string };
};

const COLUMNS = `id, x, y, text, view_width, crop_path, symbols!inner(name), symbol_meanings(id, text, symbol_meaning_contexts(position, glossary_entries(name, category))), artwork_images!inner(id, artwork_id, ${IMAGE_COLUMNS.join(', ')}, artworks!inner(deleted_at))`;

function personsOf(
	contexts: NonNullable<PinRow['symbol_meanings']>['symbol_meaning_contexts']
): string[] {
	return [...contexts]
		.sort((first, second) => first.position - second.position)
		.flatMap(({ glossary_entries: entry }) => (entry?.category === 'person' ? [entry.name] : []));
}

export async function loadSymbolQuestionPins(): Promise<{
	pins: SymbolQuestionPin[];
	error?: string;
}> {
	const { data, error } = await supabase
		.from('artwork_pins')
		.select(COLUMNS)
		.not('symbol_id', 'is', null)
		.not('crop_path', 'is', null)
		.not('view_width', 'is', null)
		.is('artwork_images.artworks.deleted_at', null);
	if (error) return { pins: [], error: await failureMessage(error, symbolErrorMessage) };
	return {
		pins: (data as unknown as PinRow[]).map((row) => ({
			pinId: row.id,
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
				artworkId: row.artwork_images.artwork_id,
				x: row.x,
				y: row.y,
				viewWidth: row.view_width,
				text: row.text ?? '',
				image: imageOf(row.artwork_images),
				cropPath: row.crop_path
			}
		}))
	};
}
