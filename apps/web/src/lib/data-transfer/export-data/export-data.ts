import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { IMAGES_BUCKET, ownThumbnailPath } from '#lib/images/bucket/bucket.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { AtelierData } from '#lib/data-transfer/types/atelier-data.ts';
import type { ExportRow } from '#lib/data-transfer/types/export-row.ts';
import { EXPORT_TABLES } from '#lib/data-transfer/tables/tables.ts';
import type { ExportTable } from '#lib/data-transfer/types/export-table.ts';

type ReadResult = { data: AtelierData; error?: undefined } | { error: string };

type StorageErrorLike = {
	status?: number;
	statusCode?: string;
};

type OwnImageDownload = { bytes: Uint8Array } | { missing: true } | { error: StorageErrorLike };

const IMAGE_PATH_COLUMNS = ['own_image_path', 'avatar_path'];

function withoutOwner(row: ExportRow): ExportRow {
	return Object.fromEntries(Object.entries(row).filter(([column]) => column !== 'owner_id'));
}

async function readTable(spec: ExportTable): Promise<{ rows: ExportRow[]; error?: unknown }> {
	const { rows, error } = await fetchAll<ExportRow>((from, to) => {
		let query = supabase.from(spec.table as 'artworks').select('*');
		if (spec.ownedOnly) query = query.not('owner_id', 'is', null);
		for (const column of spec.order) query = query.order(column);
		return query.range(from, to);
	});
	return { rows: rows.map(withoutOwner), error };
}

export async function readAtelier(): Promise<ReadResult> {
	const data: AtelierData = {};
	for (const spec of EXPORT_TABLES) {
		const { rows, error } = await readTable(spec);
		if (error) return { error: await failureMessage(error as never, () => m.settings.data.failed) };
		data[spec.table] = rows;
	}
	return { data };
}

export function ownImagePaths(data: AtelierData): string[] {
	const paths = new Set<string>();
	for (const rows of Object.values(data)) {
		for (const row of rows) {
			for (const column of IMAGE_PATH_COLUMNS) {
				const value = row[column];
				if (typeof value === 'string' && value !== '') paths.add(value);
			}
		}
	}
	return [...paths].flatMap((path) =>
		path.startsWith('avatar-') || path.includes('/avatar-')
			? [path]
			: [path, ownThumbnailPath(path)]
	);
}

function isMissing(error: StorageErrorLike): boolean {
	return error.status === 404 || error.statusCode === '404';
}

export async function downloadOwnImage(path: string): Promise<OwnImageDownload> {
	const { data, error } = await supabase.storage.from(IMAGES_BUCKET).download(path);
	if (error) return isMissing(error) ? { missing: true } : { error };
	if (!data) return { missing: true };
	return { bytes: new Uint8Array(await data.arrayBuffer()) };
}
