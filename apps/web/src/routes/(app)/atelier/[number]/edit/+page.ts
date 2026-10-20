import { loadArtwork } from '#lib/collection/artwork-record.ts';
import { emptyCategoryValues, loadCategoryValues } from '#lib/collection/category-values.ts';
import { loadNoteLinks } from '#lib/collection/note-link-data.ts';
import { emptyPlaceStarter, loadPlaceStarter } from '#lib/collection/place-starter.ts';
import { emptyValueLinks, loadValueLinks } from '#lib/collection/value-links.ts';
import { parseRecordNumber } from '#lib/collection/format.ts';
import { m } from '#lib/i18n/index.ts';
import type { LoadArtworkResult } from '#lib/collection/types.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const number = parseRecordNumber(params.number);
	if (number === null) {
		const missing: LoadArtworkResult = { error: m.artworkErrors.notFound, notFound: true };
		return {
			...missing,
			values: emptyCategoryValues(),
			links: emptyValueLinks(),
			noteLinks: undefined,
			placeStarter: emptyPlaceStarter()
		};
	}
	const [result, categories, linked, noteLinks, placeStarter] = await Promise.all([
		loadArtwork(number),
		loadCategoryValues(),
		loadValueLinks(),
		loadNoteLinks(),
		loadPlaceStarter()
	]);
	return { ...result, values: categories.values, links: linked.links, noteLinks, placeStarter };
};
