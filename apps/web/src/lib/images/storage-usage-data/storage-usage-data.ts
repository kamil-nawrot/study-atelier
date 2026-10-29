import { m } from '#lib/i18n/i18n.ts';
import { megabytes } from '#lib/images/storage-usage/storage-usage.ts';
import type { StorageUsage } from '#lib/images/types/storage-usage.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type StorageErrorLike = {
	statusCode?: string;
};

export async function loadStorageUsage(): Promise<StorageUsage | undefined> {
	const { data, error } = await supabase.rpc('storage_usage').single();
	if (error || !data) return undefined;
	return { usedBytes: data.used_bytes, quotaBytes: data.quota_bytes };
}

export async function quotaMessage(
	error: StorageErrorLike,
	size: number,
	messageFor: (quotaMegabytes: string) => string = m.ownImageErrors.quotaFull
): Promise<string | undefined> {
	if (error.statusCode !== '403') return undefined;
	const usage = await loadStorageUsage();
	if (!usage || usage.usedBytes + size <= usage.quotaBytes) return undefined;
	return messageFor(megabytes(usage.quotaBytes));
}
