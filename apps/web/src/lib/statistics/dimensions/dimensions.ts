import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { ARTWORK_TYPE_CODES } from '#lib/catalogue/artwork-types/artwork-types.ts';
import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import { m } from '#lib/i18n/i18n.ts';
import { emptyFilter, filterValuesOf, UNKNOWN_AUTHOR } from '#lib/wall/filter/filter.ts';
import { filterToParams } from '#lib/wall/filter-params/filter-params.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { MissingData } from '#lib/catalogue/types/missing-data.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';

export type Dimension = {
	key: string;
	label: string;
	order?: readonly string[];
	none: string;
	valuesOf: (artwork: WallArtwork) => string[];
	nameOf: (value: string) => string;
	filterOf: (value: string) => Partial<CollectionFilter> | undefined;
	noneFilter?: Partial<CollectionFilter>;
};

type BuiltIn = 'eras' | 'types' | 'periods' | 'styles' | 'materials' | 'authors' | 'locations';

function builtIn(field: BuiltIn, none: string, missing?: MissingData): Dimension {
	return {
		key: field,
		label: m.atelier.filters.tagFields[field],
		none,
		valuesOf: (artwork) => filterValuesOf(artwork, field),
		nameOf: (value) => value,
		filterOf: (value) => ({ [field]: [value] }),
		noneFilter: missing ? { missing: [missing] } : undefined
	};
}

export function dimensionsOf(ownFields: readonly OwnFieldDefinition[] = []): Dimension[] {
	const texts = m.statistics.composition.none;
	return [
		{
			...builtIn('eras', m.atelier.filters.missing.era, 'era'),
			order: ERA_CODES,
			nameOf: (value) => m.eras[value as keyof typeof m.eras].name
		},
		{
			...builtIn('types', m.atelier.filters.missing.type, 'type'),
			order: ARTWORK_TYPE_CODES,
			nameOf: (value) => m.artworkTypes[value as keyof typeof m.artworkTypes]
		},
		builtIn('periods', m.atelier.filters.missing.period, 'period'),
		builtIn('styles', texts.style),
		builtIn('materials', texts.material),
		{
			...builtIn('authors', ''),
			nameOf: (value) => (value === UNKNOWN_AUTHOR ? m.atelier.filters.unknownAuthor : value),
			filterOf: (value) =>
				value === UNKNOWN_AUTHOR ? { unknownAuthor: true } : { authors: [value] }
		},
		builtIn('locations', texts.location),
		...ownFields.filter((field) => field.kind === 'list').map(ownDimension)
	];
}

function ownDimension(field: OwnFieldDefinition): Dimension {
	return {
		key: `own:${field.id}`,
		label: field.name,
		none: m.statistics.composition.none.value,
		valuesOf: (artwork) => {
			const entry = artwork.own?.[field.id];
			if (Array.isArray(entry)) return entry;
			return typeof entry === 'string' && entry !== '' ? [entry] : [];
		},
		nameOf: (value) => value,
		filterOf: (value) => ({ own: { [field.id]: [value] } })
	};
}

export function wallHref(
	...parts: (Partial<CollectionFilter> | undefined)[]
): ResolvedPathname | undefined {
	if (parts.some((part) => part === undefined)) return undefined;
	const filter: CollectionFilter = Object.assign(emptyFilter(), ...parts);
	filter.own = Object.assign({}, ...parts.map((part) => part?.own ?? {}));
	return `${resolve('/(app)/atelier')}?${filterToParams(filter).toString()}` as ResolvedPathname;
}
