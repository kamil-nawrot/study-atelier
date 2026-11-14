import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { IMAGE_COLUMNS, imageOf } from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { symbolErrorMessage } from '#lib/symbols/errors/errors.ts';
import { symbolCover, type CoverCandidate } from '#lib/symbols/symbol-cover/symbol-cover.ts';

type CoverRow = {
	id: string;
	x: number;
	y: number;
	view_width: number;
	crop_path: string | null;
	symbol_meaning_id: string | null;
	created_at: string;
	artwork_images: ImageRow & { id: string; artwork_id: string };
};

const COLUMNS = `id, x, y, view_width, crop_path, symbol_meaning_id, created_at, artwork_images!inner(id, artwork_id, ${IMAGE_COLUMNS.join(', ')}, artworks!inner(deleted_at))`;

function candidateOf(row: CoverRow): CoverCandidate {
	return {
		meaningId: row.symbol_meaning_id,
		createdAt: row.created_at,
		fragment: {
			pinId: row.id,
			artworkId: row.artwork_images.artwork_id,
			x: row.x,
			y: row.y,
			viewWidth: row.view_width,
			text: '',
			image: imageOf(row.artwork_images),
			...(row.crop_path ? { cropPath: row.crop_path } : {})
		}
	};
}

export async function loadSymbolCover(
	symbolId: string,
	coverPinId?: string,
	meaningId?: string
): Promise<{ lens?: FragmentLens; error?: string }> {
	const { data, error } = await supabase
		.from('artwork_pins')
		.select(COLUMNS)
		.eq('symbol_id', symbolId)
		.not('view_width', 'is', null)
		.is('artwork_images.artworks.deleted_at', null)
		.order('created_at', { ascending: false })
		.order('id');
	if (error) return { error: await failureMessage(error, symbolErrorMessage) };
	const fragment = symbolCover(
		(data as unknown as CoverRow[]).map(candidateOf),
		coverPinId,
		meaningId
	);
	if (!fragment) return {};
	const lens = (await fragmentLenses([fragment])).get(fragment.pinId);
	return lens ? { lens } : {};
}
