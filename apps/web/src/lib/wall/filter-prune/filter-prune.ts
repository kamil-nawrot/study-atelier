import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { filterValuesOf } from '#lib/wall/filter/filter.ts';

const NAME_FIELDS = ['authors', 'periods', 'styles', 'materials', 'locations'] as const;

export function pruneFilter(
	filter: CollectionFilter,
	artworks: WallArtwork[],
	fields?: readonly OwnFieldDefinition[]
): CollectionFilter {
	const pruned = { ...filter };
	for (const field of NAME_FIELDS) {
		const existing = new Set(artworks.flatMap((artwork) => filterValuesOf(artwork, field)));
		pruned[field] = filter[field].filter((value) => existing.has(value));
	}
	if (!fields) return pruned;
	const ofKind = (kind: OwnFieldDefinition['kind']): Set<string> =>
		new Set(fields.filter((field) => field.kind === kind).map((field) => field.id));
	const lists = ofKind('list');
	const texts = ofKind('text');
	const flags = ofKind('flag');
	pruned.own = Object.fromEntries(
		Object.entries(filter.own)
			.filter(([id]) => lists.has(id))
			.map(([id, values]) => {
				const existing = new Set(
					artworks.flatMap((artwork) => {
						const entry = artwork.own?.[id];
						return Array.isArray(entry) ? entry : [];
					})
				);
				return [id, values.filter((value) => existing.has(value))];
			})
			.filter(([, values]) => values.length > 0)
	);
	pruned.ownTexts = Object.fromEntries(
		Object.entries(filter.ownTexts).filter(([id]) => texts.has(id))
	);
	pruned.ticked = filter.ticked.filter((id) => flags.has(id));
	return pruned;
}
