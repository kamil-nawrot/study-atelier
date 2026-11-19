import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { ImageCheck } from '#lib/images/types/image-check.ts';

export async function saveImageCheck(check: ImageCheck): Promise<boolean> {
	const update = supabase
		.from('artwork_images')
		.update({ broken_at: check.broken ? new Date().toISOString() : null })
		.eq('id', check.id)
		.eq(check.column, check.value);
	const { error } = check.broken
		? await update.is('broken_at', null)
		: await update.not('broken_at', 'is', null);
	return !error;
}
