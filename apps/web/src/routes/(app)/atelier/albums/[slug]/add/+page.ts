import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { entryIdsOf } from '#lib/albums/album-add-address/album-add-address.ts';
import { loadAlbumWalk } from '#lib/albums/album-pages/album-pages.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params, url }) => {
	const [walk, own] = await Promise.all([
		loadAlbumWalk(params.slug, entryIdsOf(url.searchParams), fetch),
		loadOwnFieldDefinitions()
	]);
	if (walk.album && walk.artworks.length === 0) {
		redirect(307, resolve('/(app)/atelier/albums/[slug]', { slug: params.slug }));
	}
	return { ...walk, ownFields: own.error ? undefined : own.fields };
};
