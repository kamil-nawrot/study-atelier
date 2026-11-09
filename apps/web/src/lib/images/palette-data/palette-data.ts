import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { PaletteColour } from '#lib/catalogue/types/palette-colour.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type SourceColumn = 'source_image_file' | 'own_image_path' | 'own_image_url';

function sourceOf(image: ArtworkImageInput): [SourceColumn, string] | undefined {
	switch (image.kind) {
		case 'commons':
			return ['source_image_file', image.file];
		case 'upload':
			return ['own_image_path', image.path];
		case 'url':
			return ['own_image_url', image.url];
		case 'file':
			return undefined;
	}
}

export async function savePalette(
	image: ArtworkImageInput,
	palette: readonly PaletteColour[]
): Promise<boolean> {
	const source = sourceOf(image);
	if (!image.id || !source) return false;
	const { error } = await supabase
		.from('artwork_images')
		.update({ palette: palette as unknown as Json })
		.eq('id', image.id)
		.eq(source[0], source[1]);
	return !error;
}
