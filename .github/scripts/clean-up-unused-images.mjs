import { pathToFileURL } from 'node:url';
import { storageApiFromEnv } from './storage/storage-api.mjs';

export const BUCKET = 'artwork-images';
export const MAX_REMOVALS = 100;

export async function cleanUp(api, { allowMassDelete = false, log = console.log } = {}) {
	const paths = await api.unusedImages();
	log(`Unused images: ${paths.length}`);
	for (const path of paths) log(path);
	if (paths.length === 0) return { removed: 0 };
	if (paths.length > MAX_REMOVALS && !allowMassDelete) {
		throw new Error(
			`Refusing to remove ${paths.length} images in one run (more than ${MAX_REMOVALS}). ` +
				'Check the list above, then run the workflow by hand with "allow_mass_delete" ticked.'
		);
	}
	await api.remove(BUCKET, paths);
	log(`Removed: ${paths.length}`);
	return { removed: paths.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	await cleanUp(storageApiFromEnv(), { allowMassDelete: process.env.ALLOW_MASS_DELETE === 'true' });
}
