import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { parseRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadEditorNoteLinks, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadArtworkPins } from '#lib/pins/pin-data/pin-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { LoadArtworkResult } from '#lib/artworks/types/load-artwork-result.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const number = parseRecordNumber(params.number);
	if (number === null) {
		const missing: LoadArtworkResult = { error: m.artworkErrors.notFound, notFound: true };
		return { ...missing, ownFields: undefined, pins: [], pinsError: undefined };
	}
	const [{ result, noteLinks }, own, { pins, glossary }] = await Promise.all([
		loadArtwork(number).then(async (result) => ({
			result,
			noteLinks: await loadEditorNoteLinks(
				mentionsLinks(result.artwork?.notes) ? { artworkNumber: number } : undefined
			)
		})),
		loadOwnFieldDefinitions(),
		loadArtworkPins(number).then(async (pins) => ({
			pins,
			glossary: pins.pins.some((pin) => pin.glossaryEntryId) ? await loadTermIndex() : undefined
		}))
	]);
	return {
		...result,
		pins: pins.pins,
		pinsError: pins.error,
		ownFields: own.error ? undefined : own.fields,
		glossary: glossary?.error ? undefined : glossary?.terms,
		noteLinks
	};
};
