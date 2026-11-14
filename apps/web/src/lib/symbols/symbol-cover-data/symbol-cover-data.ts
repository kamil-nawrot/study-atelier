import type { ServiceErrorLike } from '#lib/auth/types/service-error-like.ts';
import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { IMAGE_COLUMNS, imageOf } from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { symbolErrorMessage } from '#lib/symbols/errors/errors.ts';

type CoverRow = {
	id: string;
	x: number;
	y: number;
	view_width: number;
	crop_path: string | null;
	artwork_images: ImageRow & { id: string; artwork_id: string };
};

const COLUMNS = `id, x, y, view_width, crop_path, artwork_images!inner(id, artwork_id, ${IMAGE_COLUMNS.join(', ')}, artworks!inner(deleted_at))`;

function fragmentOf(row: CoverRow): PinFragment {
	return {
		pinId: row.id,
		artworkId: row.artwork_images.artwork_id,
		x: row.x,
		y: row.y,
		viewWidth: row.view_width,
		text: '',
		image: imageOf(row.artwork_images),
		...(row.crop_path ? { cropPath: row.crop_path } : {})
	};
}

function details(symbolId: string, meaningId?: string) {
	const query = supabase
		.from('artwork_pins')
		.select(COLUMNS)
		.eq('symbol_id', symbolId)
		.not('view_width', 'is', null)
		.is('artwork_images.artworks.deleted_at', null);
	return meaningId === undefined ? query : query.eq('symbol_meaning_id', meaningId);
}

async function coverRow(
	symbolId: string,
	coverPinId?: string,
	meaningId?: string
): Promise<{ row?: CoverRow; error?: ServiceErrorLike }> {
	if (coverPinId !== undefined) {
		const { data, error } = await details(symbolId, meaningId).eq('id', coverPinId).limit(1);
		if (error) return { error };
		if (data.length > 0) return { row: data[0] as unknown as CoverRow };
	}
	const { data, error } = await details(symbolId, meaningId)
		.order('created_at', { ascending: false })
		.order('id')
		.limit(1);
	if (error) return { error };
	return data.length > 0 ? { row: data[0] as unknown as CoverRow } : {};
}

export async function loadSymbolCover(
	symbolId: string,
	coverPinId?: string,
	meaningId?: string
): Promise<{ lens?: FragmentLens; error?: string }> {
	const { row, error } = await coverRow(symbolId, coverPinId, meaningId);
	if (error) return { error: await failureMessage(error, symbolErrorMessage) };
	if (!row) return {};
	const fragment = fragmentOf(row);
	const lens = (await fragmentLenses([fragment])).get(fragment.pinId);
	return lens ? { lens } : {};
}
