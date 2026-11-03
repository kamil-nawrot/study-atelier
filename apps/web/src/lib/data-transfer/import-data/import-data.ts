import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { IMAGES_BUCKET, OWN_IMAGE_CACHE_SECONDS } from '#lib/images/bucket/bucket.ts';
import { m } from '#lib/i18n/i18n.ts';
import { isRowLimitError } from '#lib/shared/data/errors/errors.ts';
import { forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { ExportRow } from '#lib/data-transfer/types/export-row.ts';
import type { Upload } from '#lib/data-transfer/types/upload.ts';

export const ATELIER_EMPTY_DEPENDENCY = 'atelier:empty';

export async function loadAtelierEmpty(): Promise<boolean | undefined> {
	const { data, error } = await supabase.rpc('atelier_empty');
	return error ? undefined : data;
}

export async function currentOwnerId(): Promise<string | undefined> {
	const { data } = await supabase.auth.getSession();
	return data.session?.user.id;
}

export async function uploadImport(upload: Upload): Promise<boolean> {
	const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(upload.path, upload.bytes, {
		contentType: upload.contentType,
		cacheControl: String(OWN_IMAGE_CACHE_SECONDS),
		upsert: false
	});
	return !error;
}

export async function removeUploads(paths: string[]): Promise<void> {
	if (paths.length === 0) return;
	await supabase.storage.from(IMAGES_BUCKET).remove(paths);
}

export async function importAtelier(
	payload: Record<string, ExportRow[]>
): Promise<{ error?: string; notEmpty?: boolean }> {
	const { error } = await supabase.rpc('import_atelier', { payload: payload as never });
	forgetCached();
	if (!error) return {};
	if (error.code === '55000') return { error: m.settings.data.importNotEmpty, notEmpty: true };
	if (isRowLimitError(error)) return { error: m.settings.data.importLimit };
	return { error: await failureMessage(error, () => m.settings.data.importFailed) };
}
