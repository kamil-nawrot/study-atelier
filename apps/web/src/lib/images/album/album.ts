import { asset } from '$app/paths';

export const ALBUMS_FOLDER = 'albums';

export function albumFileUrl(path: string): string {
	return asset(`${ALBUMS_FOLDER}/${path}` as Parameters<typeof asset>[0]);
}
