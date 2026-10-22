import { loadCardIndex } from '#lib/collection/card-index-data.ts';
import { loadOwnFields } from '#lib/collection/own-fields.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [cardIndex, ownFields] = await Promise.all([loadCardIndex(), loadOwnFields()]);
	return { ...cardIndex, error: cardIndex.error ?? ownFields.error, ownFields: ownFields.fields };
};
