import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { m } from '#lib/i18n/i18n.ts';
import { loadOwnValues } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadOwnFields } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { withOwnValues } from '#lib/card-index/own-fields/own-fields.ts';
import { loadArtworksOfValue } from '#lib/wall/wall-data/wall-data.ts';
import type { OwnField } from '#lib/card-index/types/own-field.ts';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type OwnFieldPageData = {
	field?: OwnField;
	fields: OwnField[];
	error?: string;
	notFound?: boolean;
};

export type OwnValuePageData = OwnFieldPageData & {
	value?: OwnValue;
	artworks: WallArtwork[];
};

export function ownFieldPath(id: string): ResolvedPathname {
	return resolve('/(app)/atelier/fields/[id]', { id });
}

export function ownValuePath(fieldId: string, valueId: string): ResolvedPathname {
	return resolve('/(app)/atelier/fields/[id]/values/[valueId]', { id: fieldId, valueId });
}

export async function loadOwnFieldPage(id: string): Promise<OwnFieldPageData> {
	const [definitions, values] = await Promise.all([loadOwnFields(), loadOwnValues()]);
	const error = definitions.error ?? values.error;
	if (error) return { fields: [], error };
	const fields = withOwnValues(definitions.fields, values.ownValues);
	const field = fields.find((candidate) => candidate.id === id);
	return field ? { field, fields } : { fields, error: m.ownFields.page.notFound, notFound: true };
}

export async function loadOwnValuePage(
	fieldId: string,
	valueId: string
): Promise<OwnValuePageData> {
	const [page, own] = await Promise.all([
		loadOwnFieldPage(fieldId),
		loadArtworksOfValue({ valueId })
	]);
	if (!page.field) return { ...page, artworks: [] };
	const value = page.field.values.find((candidate) => candidate.id === valueId);
	if (!value)
		return { fields: page.fields, artworks: [], error: m.ownFields.page.notFound, notFound: true };
	if ('error' in own && own.error) return { fields: page.fields, artworks: [], error: own.error };
	return { ...page, value, artworks: own.artworks };
}
