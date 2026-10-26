import { m } from '#lib/i18n/i18n.ts';
import {
	currentOwnerId,
	importAtelier,
	removeUploads,
	uploadImport
} from '#lib/data-transfer/import-data/import-data.ts';
import { parseArchive } from '#lib/data-transfer/parse/parse.ts';
import { loadStorageUsage } from '#lib/images/storage-usage-data/storage-usage-data.ts';
import type { ParseFailure } from '#lib/data-transfer/types/parse-failure.ts';
import { remapAtelier } from '#lib/data-transfer/remap/remap.ts';
import type { ImportProgress } from '#lib/data-transfer/types/import-progress.ts';

type ImportResult = { imported: true; error?: undefined } | { error: string; notEmpty?: boolean };

const FAILURES: Record<ParseFailure, () => string> = {
	notZip: () => m.settings.data.importNotZip,
	noData: () => m.settings.data.importNoData,
	notAtelier: () => m.settings.data.importNotAtelier,
	newer: () => m.settings.data.importNewer,
	broken: () => m.settings.data.importBroken
};

export async function importArchive(
	file: Blob,
	onprogress: (progress: ImportProgress) => void
): Promise<ImportResult> {
	onprogress({ step: 'reading' });
	const parsed = parseArchive(new Uint8Array(await file.arrayBuffer()));
	if ('failure' in parsed) return { error: FAILURES[parsed.failure]() };

	const ownerId = await currentOwnerId();
	if (!ownerId) return { error: m.settings.data.importFailed };
	const { payload, uploads } = remapAtelier(
		parsed.archive.file.data,
		parsed.archive.images,
		ownerId
	);

	const usage = await loadStorageUsage();
	const uploadBytes = uploads.reduce((sum, upload) => sum + upload.bytes.byteLength, 0);
	if (usage && usage.usedBytes + uploadBytes > usage.quotaBytes) {
		return { error: m.settings.data.importLimit };
	}

	const uploaded: string[] = [];
	for (const [index, upload] of uploads.entries()) {
		onprogress({ step: 'images', done: index, total: uploads.length });
		if (!(await uploadImport(upload))) {
			await removeUploads(uploaded);
			return { error: m.settings.data.importFailed };
		}
		uploaded.push(upload.path);
	}
	onprogress({ step: 'images', done: uploads.length, total: uploads.length });

	onprogress({ step: 'saving' });
	const result = await importAtelier(payload);
	if (result.error !== undefined) {
		await removeUploads(uploaded);
		return { error: result.error, notEmpty: result.notEmpty };
	}
	return { imported: true };
}
