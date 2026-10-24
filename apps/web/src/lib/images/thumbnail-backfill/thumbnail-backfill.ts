import { uploadOwnThumbnail } from '#lib/images/own-image/own-image.ts';

const attempted = new Set<string>();
let queue: Promise<void> = Promise.resolve();

async function backfill(path: string, url: string): Promise<void> {
	try {
		const response = await fetch(url);
		if (!response.ok) return;
		await uploadOwnThumbnail(path, await response.blob());
	} catch {
		return;
	}
}

export function backfillThumbnails(originals: Map<string, string>): void {
	for (const [path, url] of originals) {
		if (attempted.has(path)) continue;
		attempted.add(path);
		queue = queue.then(() => backfill(path, url));
	}
}
