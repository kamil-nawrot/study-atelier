import { loadAlbumGallery } from '#lib/albums/album-pages/album-pages.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => loadAlbumGallery(params.slug, fetch);
