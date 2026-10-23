import { resolve } from '$app/paths';
import { loadArtwork } from '#lib/collection/artwork-record.ts';
import { parseRecordNumber } from '#lib/collection/format.ts';
import { loadMentions } from '#lib/collection/mentions.ts';
import { loadOwnFieldDefinitions } from '#lib/collection/own-fields.ts';
import { loadValueSummaries } from '#lib/collection/value-summaries.ts';
import { loadNoteLinks, mentionsLinks } from '#lib/collection/note-link-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import { m } from '#lib/i18n/index.ts';
import { loadPreferences } from '#lib/profile/preferences-data.ts';
import { loadArtworkPins } from '#lib/pins/pin-data.ts';
import type { LoadArtworkResult } from '#lib/collection/types.ts';
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
