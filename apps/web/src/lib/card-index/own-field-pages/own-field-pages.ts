import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { m } from '#lib/i18n/i18n.ts';
import { loadOwnFields } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { withOwnValues } from '#lib/card-index/own-fields/own-fields.ts';
import { loadArtworksOfValue } from '#lib/wall/wall-data/wall-data.ts';
import type { OwnField } from '#lib/card-index/types/own-field.ts';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadRelations } from '#lib/relations/relations-data/relations-data.ts';
import type { Relations } from '#lib/relations/types/relations.ts';

export type OwnFieldPageData = {
	field?: OwnField;
	fields: OwnField[];
	error?: string;
	notFound?: boolean;
};

export type OwnValuePageData = OwnFieldPageData & {
	value?: OwnValue;
	artworks: WallArtwork[];
	relations?: Relations;
};

export function ownFieldPath(id: string): ResolvedPathname {
	return resolve('/(app)/atelier/fields/[id]', { id });
}

export function ownValuePath(fieldId: string, valueId: string): ResolvedPathname {
	return resolve('/(app)/atelier/fields/[id]/values/[valueId]', { id: fieldId, valueId });
}

export async function loadOwnFieldPage(id: string): Promise<OwnFieldPageData> {
	const [definitions, cardIndex] = await Promise.all([loadOwnFields(), loadCardIndex()]);
	const error = definitions.error ?? cardIndex.error;
	if (error) return { fields: [], error };
	const fields = withOwnValues(definitions.fields, cardIndex.ownValues);
	const field = fields.find((candidate) => candidate.id === id);
	return field ? { field, fields } : { fields, error: m.ownFields.page.notFound, notFound: true };
}

export async function loadOwnValuePage(
	fieldId: string,
	valueId: string
): Promise<OwnValuePageData> {
	const [page, own, cardIndex] = await Promise.all([
		loadOwnFieldPage(fieldId),
		loadArtworksOfValue({ valueId }),
		loadCardIndex()
	]);
	if (!page.field) return { ...page, artworks: [] };
	const value = page.field.values.find((candidate) => candidate.id === valueId);
	if (!value)
		return { fields: page.fields, artworks: [], error: m.ownFields.page.notFound, notFound: true };
	if ('error' in own && own.error) return { fields: page.fields, artworks: [], error: own.error };
	const relations = await loadRelations({
		kind: 'own',
		artworks: own.artworks,
		index: cardIndex.index
	});
	return { ...page, value, artworks: own.artworks, relations };
}
