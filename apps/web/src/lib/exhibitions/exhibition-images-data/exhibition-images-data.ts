import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import { IMAGE_COLUMNS, imageOf, withPreviews } from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type ImagesResult = {
	images: Map<string, ArtworkImageInput[]>;
	error?: string;
};

type ImageRecordRow = ImageRow & {
	id: string;
	artwork_id: string;
	position: number;
	palette: Json | null;
};

export async function loadArtworkImages(ids: readonly string[]): Promise<ImagesResult> {
	if (ids.length === 0) return { images: new Map() };
	const { data, error } = await supabase
		.from('artwork_images')
		.select(`id, artwork_id, position, palette, ${IMAGE_COLUMNS.join(', ')}`)
		.in('artwork_id', [...ids])
		.order('position');
	if (error) return { images: new Map(), error: collectionErrorMessage(error) };
	const rows = data as unknown as ImageRecordRow[];
	const parsed = rows.map((row) => imageOf(row));
	const previewed = await withPreviews(parsed);
	const images = new Map<string, ArtworkImageInput[]>();
	rows.forEach((row, index) => {
		const image = previewed[index];
		if (!image) return;
		images.set(row.artwork_id, [...(images.get(row.artwork_id) ?? []), image]);
	});
	return { images };
}
