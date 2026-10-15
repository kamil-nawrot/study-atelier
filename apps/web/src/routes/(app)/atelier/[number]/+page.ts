import { resolve } from '$app/paths';
import { loadArtwork } from '#lib/collection/artwork-record.ts';
import { parseRecordNumber } from '#lib/collection/format.ts';
import { loadMentions } from '#lib/collection/mentions.ts';
import { loadValueSummaries } from '#lib/collection/value-summaries.ts';
import { loadNoteLinks, mentionsLinks } from '#lib/collection/note-link-data.ts';
import { m } from '#lib/i18n/index.ts';
import type { LoadArtworkResult } from '#lib/collection/types.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<LoadArtworkResult> => {
	const number = parseRecordNumber(params.number);
	if (number === null) return { error: m.artworkErrors.notFound, notFound: true };
	const [result, mentions, summaries] = await Promise.all([
		loadArtwork(number),
		loadMentions(resolve('/(app)/atelier/[number]', { number: params.number })),
		loadValueSummaries(number)
	]);
	if (!mentionsLinks(result.artwork?.notes)) return { ...result, mentions, summaries };
	return { ...result, mentions, summaries, noteLinks: await loadNoteLinks() };
};
