import { loadArtwork } from '#lib/collection/artwork-record.ts';
import { parseRecordNumber } from '#lib/collection/format.ts';
import { m } from '#lib/i18n/index.ts';
import type { LoadArtworkResult } from '#lib/collection/types.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<LoadArtworkResult> => {
	const number = parseRecordNumber(params.number);
	if (number === null) return { error: m.artworkErrors.notFound, notFound: true };
	return loadArtwork(number);
};
