import { m } from '#lib/i18n/index.ts';
import { ArchiveBuilder, atelierFile } from './archive.ts';
import { downloadOwnImage, ownImagePaths, readAtelier } from './export-data.ts';
import { archiveName, type ExportProgress, type ExportResult } from './format.ts';

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
		const bytes = await downloadOwnImage(path);
		if (bytes) archive.addImage({ path, bytes });
	}
	onprogress({ step: 'images', done: paths.length, total: paths.length });

	onprogress({ step: 'archive' });
	try {
		return { blob: archive.finish(), name: archiveName(now) };
	} catch {
		return { error: m.settings.data.failed };
	}
}
