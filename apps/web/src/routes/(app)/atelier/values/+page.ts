import { loadCardIndex } from '#lib/collection/card-index-data.ts';
import { loadOwnFields, withOwnValues } from '#lib/collection/own-fields.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [{ ownValues, ...cardIndex }, own] = await Promise.all([loadCardIndex(), loadOwnFields()]);
	return {
		...cardIndex,
		ownFields: withOwnValues(own.fields, ownValues),
		ownFieldsError: own.error
	};
};
