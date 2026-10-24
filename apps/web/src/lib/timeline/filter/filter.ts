import {
	emptyFilter,
	favouriteCount,
	filterOptions,
	filterTags,
	isEmptyFilter,
	matchesFilter,
	removeTag,
	toggleFavourites,
	toggleValue
} from '#lib/wall/filter/filter.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
import type { FilterOption } from '#lib/catalogue/types/filter-option.ts';
import type { FilterTag } from '#lib/catalogue/types/filter-tag.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { overlaps, spanOfYears, type TimeSpan } from '#lib/timeline/time/time.ts';
import type { Lane, LaneField, TimelineFilter } from '#lib/timeline/types.ts';

export const MAX_LANES = 5;

export function emptyTimelineFilter(): TimelineFilter {
	return { lanes: [], favourites: false, types: [], authors: [], unknownAuthor: false };
}

function baseOf(filter: TimelineFilter): CollectionFilter {
	return {
		...emptyFilter(),
		favourites: filter.favourites,
		types: filter.types,
		authors: filter.authors,
		unknownAuthor: filter.unknownAuthor
	};
}

function withBase(filter: TimelineFilter, base: CollectionFilter): TimelineFilter {
	return {
		...filter,
		favourites: base.favourites,
		types: base.types,
		authors: base.authors,
		unknownAuthor: base.unknownAuthor
	};
}

export function isEmptyTimelineFilter(filter: TimelineFilter): boolean {
	return filter.lanes.length === 0 && isEmptyFilter(baseOf(filter));
}

export function inLane(artwork: WallArtwork, lane: Lane): boolean {
	return lane.field === 'periods'
		? artwork.period === lane.value
		: artwork.styles.includes(lane.value);
}

function sameLane(lane: Lane, other: Lane): boolean {
	return lane.field === other.field && lane.value === other.value;
}

export function laneIndex(filter: TimelineFilter, lane: Lane): number {
	return filter.lanes.findIndex((chosen) => sameLane(chosen, lane));
}

export function lanesOf(artwork: WallArtwork, filter: TimelineFilter): number[] {
	return filter.lanes.flatMap((lane, index) => (inLane(artwork, lane) ? [index] : []));
}

function inAnyLane(artwork: WallArtwork, filter: TimelineFilter): boolean {
	return filter.lanes.length === 0 || filter.lanes.some((lane) => inLane(artwork, lane));
}

export function matchesTimelineFilter(artwork: WallArtwork, filter: TimelineFilter): boolean {
	return inAnyLane(artwork, filter) && matchesFilter(artwork, baseOf(filter));
}

export function applyTimelineFilter(
	artworks: readonly WallArtwork[],
	filter: TimelineFilter
): WallArtwork[] {
	return artworks.filter((artwork) => matchesTimelineFilter(artwork, filter));
}

export function artworksIn(artworks: readonly WallArtwork[], span: TimeSpan): WallArtwork[] {
	return artworks.filter(
		(artwork) =>
			artwork.yearTo !== null && overlaps(spanOfYears(artwork.yearFrom, artwork.yearTo), span)
	);
}

export function lanesFull(filter: TimelineFilter): boolean {
	return filter.lanes.length >= MAX_LANES;
}

export function toggleLane(filter: TimelineFilter, lane: Lane): TimelineFilter {
	if (laneIndex(filter, lane) >= 0)
		return { ...filter, lanes: filter.lanes.filter((chosen) => !sameLane(chosen, lane)) };
	if (lanesFull(filter)) return filter;
	return { ...filter, lanes: [...filter.lanes, lane] };
}

export function chosenLaneValues(filter: TimelineFilter, field: LaneField): string[] {
	return filter.lanes.filter((lane) => lane.field === field).map((lane) => lane.value);
}

export function laneOptions(
	artworks: readonly WallArtwork[],
	filter: TimelineFilter,
	field: LaneField
): FilterOption[] {
	const base = { ...baseOf(filter), [field]: chosenLaneValues(filter, field) };
	return filterOptions([...artworks], base, field);
}

export function valueOptions(
	artworks: readonly WallArtwork[],
	filter: TimelineFilter,
	field: 'types' | 'authors'
): FilterOption[] {
	return filterOptions(
		artworks.filter((artwork) => inAnyLane(artwork, filter)),
		baseOf(filter),
		field
	);
}

export function timelineFavouriteCount(
	artworks: readonly WallArtwork[],
	filter: TimelineFilter
): number {
	return favouriteCount(
		artworks.filter((artwork) => inAnyLane(artwork, filter)),
		baseOf(filter)
	);
}

export function toggleTimelineFavourites(filter: TimelineFilter): TimelineFilter {
	return withBase(filter, toggleFavourites(baseOf(filter)));
}

export function toggleAuthor(filter: TimelineFilter, value: string): TimelineFilter {
	return withBase(filter, toggleValue(baseOf(filter), 'authors', value));
}

export function timelineTags(filter: TimelineFilter): FilterTag[] {
	return [
		...filter.lanes.map((lane) => ({
			id: `${lane.field}:${lane.value}`,
			field: lane.field,
			value: lane.value
		})),
		...filterTags(baseOf(filter))
	];
}

export function tagLane(filter: TimelineFilter, tag: FilterTag): number {
	if (tag.field !== 'periods' && tag.field !== 'styles') return -1;
	return laneIndex(filter, { field: tag.field, value: tag.value });
}

export function removeTimelineTag(filter: TimelineFilter, tag: FilterTag): TimelineFilter {
	if (tag.field === 'periods' || tag.field === 'styles')
		return toggleLane(filter, { field: tag.field, value: tag.value });
	return withBase(filter, removeTag(baseOf(filter), tag));
}

export function forOtherEra(filter: TimelineFilter): TimelineFilter {
	return filter.lanes.length === 0 ? filter : { ...filter, lanes: [] };
}

export function laneColour(index: number): string {
	return `var(--color-lane-${index + 1})`;
}
