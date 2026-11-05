import { resolve } from '$app/paths';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { RelatedGroup } from '#lib/relations/types/related-group.ts';
import type { RelatedValue } from '#lib/relations/types/related-value.ts';
import type { RelationsKind } from '#lib/relations/types/relations-kind.ts';
import type { TypeCount } from '#lib/relations/types/type-count.ts';
import type { YearSpan } from '#lib/relations/types/year-span.ts';

const SHOWN_VALUES = 8;

type GroupLabel = keyof typeof m.relations.groups;
type GroupSpec = { label: GroupLabel; categories: CategoryCode[] };

const PERIODS: GroupSpec = { label: 'periods', categories: ['period'] };
const STYLES: GroupSpec = { label: 'styles', categories: ['style'] };
const AUTHORS: GroupSpec = { label: 'authors', categories: ['author'] };

const GROUPS: Record<RelationsKind, GroupSpec[]> = {
	era: [PERIODS, STYLES],
	period: [STYLES, AUTHORS],
	style: [PERIODS, AUTHORS],
	author: [
		{ label: 'periodsAndStyles', categories: ['period', 'style'] },
		{ label: 'materials', categories: ['material'] },
		{ label: 'places', categories: ['location'] }
	],
	event: [AUTHORS, PERIODS],
	material: [AUTHORS, PERIODS],
	location: [AUTHORS, PERIODS],
	own: [AUTHORS, PERIODS]
};

const EVENT_KINDS: readonly RelationsKind[] = ['era', 'period', 'style', 'author', 'event'];

function valuesOf(artwork: WallArtwork, category: CategoryCode): string[] {
	if (category === 'period') return artwork.period ? [artwork.period] : [];
	if (category === 'style') return artwork.styles;
	if (category === 'material') return artwork.materials;
	if (category === 'author') return artwork.authors;
	return artwork.location ? [artwork.location] : [];
}

function relatedValues(
	artworks: readonly WallArtwork[],
	categories: CategoryCode[],
	index: CardIndexData
): RelatedValue[] {
	const counts = new Map<string, RelatedValue>();
	for (const artwork of artworks) {
		for (const category of categories) {
			for (const name of new Set(valuesOf(artwork, category))) {
				const record = index.values.find(
					(value) => value.category === category && value.name === name
				);
				if (!record) continue;
				const href = resolve('/(app)/atelier/values/[kind]/[id]', {
					kind: category,
					id: record.id
				});
				const known = counts.get(record.id);
				counts.set(record.id, { id: record.id, name, href, count: (known?.count ?? 0) + 1 });
			}
		}
	}
	return [...counts.values()]
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pl'))
		.slice(0, SHOWN_VALUES);
}

export function relatedGroups(
	kind: RelationsKind,
	artworks: readonly WallArtwork[],
	index: CardIndexData
): RelatedGroup[] {
	return GROUPS[kind]
		.map(({ label, categories }) => ({
			label: m.relations.groups[label],
			values: relatedValues(artworks, categories, index)
		}))
		.filter((group) => group.values.length > 0);
}

export function typeCounts(artworks: readonly WallArtwork[]): TypeCount[] {
	const counts = new Map<TypeCount['code'], number>();
	for (const artwork of artworks) {
		if (artwork.typeCode) counts.set(artwork.typeCode, (counts.get(artwork.typeCode) ?? 0) + 1);
	}
	return [...counts].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count);
}

export function artworkYears(artworks: readonly WallArtwork[]): number[] {
	return artworks
		.map((artwork) => artwork.yearTo)
		.filter((year) => year !== null)
		.sort((a, b) => a - b);
}

export function yearsSpan(years: readonly number[]): YearSpan | undefined {
	if (years.length === 0) return undefined;
	return { from: years[0], to: years[years.length - 1] };
}

export function eventsWindow(
	kind: RelationsKind,
	bounds: YearSpan | undefined,
	years: readonly number[]
): YearSpan | undefined {
	if (!EVENT_KINDS.includes(kind)) return undefined;
	return bounds ?? yearsSpan(years);
}
