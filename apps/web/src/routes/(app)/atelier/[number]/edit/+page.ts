import { loadArtwork } from '#lib/collection/artwork-record.ts';
import { emptyCategoryValues, loadCategoryValues } from '#lib/collection/category-values.ts';
import { loadNoteLinks } from '#lib/collection/note-link-data.ts';
import { loadOwnFieldDefinitions } from '#lib/collection/own-fields.ts';
import { emptyPlaceStarter, loadPlaceStarter } from '#lib/collection/place-starter.ts';
import { emptyValueLinks, loadValueLinks } from '#lib/collection/value-links.ts';
import { parseRecordNumber } from '#lib/collection/format.ts';
import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { loadPins } from '#lib/pins/pin-data.ts';
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
			ownValues: {},
			ownFields: undefined,
			links: emptyValueLinks(),
			noteLinks: undefined,
			placeStarter: emptyPlaceStarter(),
			pins: [],
			glossary: []
		};
	}
	const [result, categories, linked, noteLinks, placeStarter, own] = await Promise.all([
		loadArtwork(number),
		loadCategoryValues(),
		loadValueLinks(),
		loadNoteLinks(),
		loadPlaceStarter(),
		loadOwnFieldDefinitions()
	]);
	const imageIds = [result.artwork?.image, ...(result.artwork?.images ?? [])].flatMap(
		(image) => image?.id ?? []
	);
	const [pins, glossary] = await Promise.all([
		loadPins(imageIds),
		result.artwork ? loadGlossary() : undefined
	]);
	return {
		...result,
		pins: pins.pins,
		glossary: glossary?.entries ?? [],
		values: categories.values,
		ownValues: categories.ownValues,
		ownFields: own.error ? undefined : own.fields,
		links: linked.links,
		noteLinks,
		placeStarter
	};
};
