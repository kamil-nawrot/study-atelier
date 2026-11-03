import { resolve } from '$app/paths';
import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import { loadArtworkVisits } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { parseRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { loadMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { loadValueSummaries } from '#lib/card-index/value-summaries-data/value-summaries-data.ts';
import { loadNoteLinkLabels, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { loadArtworkPins } from '#lib/pins/pin-data/pin-data.ts';
import type { LoadArtworkResult } from '#lib/artworks/types/load-artwork-result.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, untrack }): Promise<LoadArtworkResult> => {
	const number = parseRecordNumber(params.number);
	if (number === null) return { error: m.artworkErrors.notFound, notFound: true };
	const [
		{ result, noteLinks },
		mentions,
		summaries,
		own,
		layout,
		loadedPins,
		loadedGlossary,
		seen
	] = await Promise.all([
		loadArtwork(number).then(async (result) => ({
			result,
			noteLinks: mentionsLinks(result.artwork?.notes)
				? await loadNoteLinkLabels({ artworkNumber: number })
				: undefined
		})),
		loadMentions(
			{ artworkNumber: number },
			resolve('/(app)/atelier/[number]', { number: String(number) })
		),
		loadValueSummaries(number),
		loadOwnFieldDefinitions(),
		untrack(() => parent()),
		loadArtworkPins(number),
		loadTermIndex(),
		loadArtworkVisits(number)
	]);
	const visits = seen.visits;
	const preferences = layout.preferences ?? defaultPreferences;
	const ownFields = own.fields;
	const glossary = result.artwork ? loadedGlossary.terms : undefined;
	const pins = loadedPins.pins;
	const pinsError = loadedPins.error;
	return {
		...result,
		mentions,
		visits,
		summaries,
		glossary,
		pins,
		pinsError,
		ownFields,
		preferences,
		...(noteLinks ? { noteLinks } : {})
	};
};
