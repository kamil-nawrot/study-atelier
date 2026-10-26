import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { storageApiFromEnv } from './storage/storage-api.mjs';

export const BUCKET = 'artwork-images';

export async function downloadBucket(api, folder, log = console.log) {
	const paths = await api.listAll(BUCKET);
	for (const file of paths) {
		const target = path.join(folder, file);
		await mkdir(path.dirname(target), { recursive: true });
		await writeFile(target, await api.download(BUCKET, file));
	}
	log(`Downloaded: ${paths.length}`);
	return paths.length;
}

async function filesUnder(folder, prefix = '') {
	const files = [];
	for (const entry of await readdir(path.join(folder, prefix), { withFileTypes: true })) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) files.push(...(await filesUnder(folder, relative)));
		else files.push(relative);
	}
	return files;
}

export async function uploadBucket(api, folder, log = console.log) {
	const files = await filesUnder(folder);
	for (const file of files) {
		await api.upload(BUCKET, file, await readFile(path.join(folder, file)));
	}
	log(`Uploaded: ${files.length}`);
	return files.length;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [direction, folder] = process.argv.slice(2);
	if (!folder || !['download', 'upload'].includes(direction)) {
		throw new Error('Usage: node copy-bucket.mjs download|upload <folder>');
	}
	const api = storageApiFromEnv();
	if (direction === 'download') await downloadBucket(api, folder);
	else await uploadBucket(api, folder);
}
