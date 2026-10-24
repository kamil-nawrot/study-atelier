import { resolve } from '$app/paths';
import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import { parseRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { loadMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { loadValueSummaries } from '#lib/card-index/value-summaries-data/value-summaries-data.ts';
import { loadNoteLinks, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { loadPreferences } from '#lib/profile/preferences-data/preferences-data.ts';
import { loadArtworkPins } from '#lib/pins/pin-data/pin-data.ts';
import type { LoadArtworkResult } from '#lib/artworks/types/load-artwork-result.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<LoadArtworkResult> => {
	const number = parseRecordNumber(params.number);
	if (number === null) return { error: m.artworkErrors.notFound, notFound: true };
	const [result, mentions, summaries, own, loaded, loadedPins, loadedGlossary] = await Promise.all([
		loadArtwork(number),
		loadMentions(resolve('/(app)/atelier/[number]', { number: params.number })),
		loadValueSummaries(number),
		loadOwnFieldDefinitions(),
		loadPreferences(),
		loadArtworkPins(number),
		loadGlossary()
	]);
	const preferences = loaded.preferences;
	const ownFields = own.fields;
	const glossary = result.artwork ? loadedGlossary.entries : undefined;
	const pins = loadedPins.pins;
	const pinsError = loadedPins.error;
	if (!mentionsLinks(result.artwork?.notes)) {
		return { ...result, mentions, summaries, glossary, pins, pinsError, ownFields, preferences };
	}
	return {
		...result,
		mentions,
		summaries,
		glossary,
		pins,
		pinsError,
		ownFields,
		preferences,
		noteLinks: await loadNoteLinks()
	};
};
