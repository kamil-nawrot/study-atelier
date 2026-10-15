import { loadArtwork } from '#lib/collection/artwork-record.ts';
import { parseRecordNumber } from '#lib/collection/format.ts';
import { loadNoteLinks, mentionsLinks } from '#lib/collection/note-link-data.ts';
import { m } from '#lib/i18n/index.ts';
import type { LoadArtworkResult } from '#lib/collection/types.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<LoadArtworkResult> => {
	const number = parseRecordNumber(params.number);
	if (number === null) return { error: m.artworkErrors.notFound, notFound: true };
	const result = await loadArtwork(number);
	if (!mentionsLinks(result.artwork?.notes)) return result;
	return { ...result, noteLinks: await loadNoteLinks() };
};
