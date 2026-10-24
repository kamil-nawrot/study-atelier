import { failureMessage } from '#lib/auth/expired-session/expired-session.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import { ArchiveBuilder, atelierFile } from '#lib/data-transfer/archive/archive.ts';
import {
	downloadOwnImage,
	ownImagePaths,
	readAtelier
} from '#lib/data-transfer/export-data/export-data.ts';
import {
	archiveName,
	type ExportProgress,
	type ExportResult
} from '#lib/data-transfer/format/format.ts';

export async function exportAtelier(
	onprogress: (progress: ExportProgress) => void,
	now: Date = new Date()
): Promise<ExportResult> {
	onprogress({ step: 'data' });
	const read = await readAtelier();
	if (read.error !== undefined) return { error: read.error };

	const archive = new ArchiveBuilder();
	archive.addJson(atelierFile(read.data, now));

	const paths = ownImagePaths(read.data);
	for (const [index, path] of paths.entries()) {
		onprogress({ step: 'images', done: index, total: paths.length });
		const download = await downloadOwnImage(path);
		if ('error' in download) {
			return { error: await failureMessage(download.error, () => m.settings.data.imageFailed) };
		}
		if ('bytes' in download) archive.addImage({ path, bytes: download.bytes });
	}
	onprogress({ step: 'images', done: paths.length, total: paths.length });

	onprogress({ step: 'archive' });
	try {
		return { blob: archive.finish(), name: archiveName(now) };
	} catch {
		return { error: m.settings.data.failed };
	}
}
