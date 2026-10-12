import { loadArtwork } from '#lib/collection/artwork-record.ts';
import { emptyCategoryValues, loadCategoryValues } from '#lib/collection/category-values.ts';
import { parseRecordNumber } from '#lib/collection/format.ts';
import { m } from '#lib/i18n/index.ts';
import type { LoadArtworkResult } from '#lib/collection/types.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const number = parseRecordNumber(params.number);
	if (number === null) {
		const missing: LoadArtworkResult = { error: m.artworkErrors.notFound, notFound: true };
		return { ...missing, values: emptyCategoryValues() };
	}
	const [result, categories] = await Promise.all([loadArtwork(number), loadCategoryValues()]);
	return { ...result, values: categories.values };
};
