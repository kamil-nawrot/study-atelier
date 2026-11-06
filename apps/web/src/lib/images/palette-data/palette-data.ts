import type { PaletteColour } from '#lib/catalogue/types/palette-colour.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

export async function savePalette(
	imageId: string,
	palette: readonly PaletteColour[]
): Promise<boolean> {
	const { error } = await supabase
		.from('artwork_images')
		.update({ palette: palette as unknown as Json })
		.eq('id', imageId);
	return !error;
}
