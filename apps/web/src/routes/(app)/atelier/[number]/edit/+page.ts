import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { loadCategoryValues } from '#lib/card-index/category-values-data/category-values-data.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import { loadValueLinks } from '#lib/card-index/value-links-data/value-links-data.ts';
import { parseRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { loadArtworkPins } from '#lib/pins/pin-data.ts';
import { m } from '#lib/i18n/index.ts';
import type { LoadArtworkResult } from '#lib/artworks/types/load-artwork-result.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const number = parseRecordNumber(params.number);
	if (number === null) {
		const missing: LoadArtworkResult = { error: m.artworkErrors.notFound, notFound: true };
		return {
			...missing,
			values: emptyCategoryValues(),
			ownValues: {},
			ownFields: undefined,
			links: emptyValueLinks(),
			noteLinks: undefined,
			placeStarter: emptyPlaceStarter(),
			pins: [],
			pinsError: undefined,
			glossary: []
		};
	}
	const [result, categories, linked, noteLinks, placeStarter, own, pins, glossary] =
		await Promise.all([
			loadArtwork(number),
			loadCategoryValues(),
			loadValueLinks(),
			loadNoteLinks(),
			loadPlaceStarter(),
			loadOwnFieldDefinitions(),
			loadArtworkPins(number),
			loadGlossary()
		]);
	return {
		...result,
		pins: pins.pins,
		pinsError: pins.error,
		glossary: glossary.entries,
		values: categories.values,
		ownValues: categories.ownValues,
		ownFields: own.error ? undefined : own.fields,
		links: linked.links,
		noteLinks,
		placeStarter
	};
};
