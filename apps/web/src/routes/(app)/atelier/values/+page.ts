import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { withOwnValues } from '#lib/card-index/own-fields/own-fields.ts';
import { loadOwnFields } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [{ ownValues, ...cardIndex }, own] = await Promise.all([loadCardIndex(), loadOwnFields()]);
	return {
		...cardIndex,
		ownFields: withOwnValues(own.fields, ownValues),
		ownFieldsError: own.error
	};
};
