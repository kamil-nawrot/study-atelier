<script lang="ts">
	import { Switch, ToggleTiles, type ChoiceTile } from '@study-atelier/ui';
	import { artworkTypeTiles } from '#lib/catalogue/artwork-types/artwork-types.ts';
	import FavouriteToggle from '#lib/wall/components/FavouriteToggle/FavouriteToggle.svelte';
	import FilterValues from '#lib/wall/components/FilterValues/FilterValues.svelte';
	import { eraName } from '#lib/catalogue/eras/eras.ts';
	import { UNKNOWN_AUTHOR } from '#lib/wall/filter/filter.ts';
	import { optionLabel } from '#lib/wall/filter-tags/filter-tags.ts';
	import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		chosenLaneValues,
		laneColour,
		laneIndex,
		laneOptions,
		lanesFull,
		timelineFavouriteCount,
		toggleAuthor,
		toggleLane,
		toggleTimelineFavourites,
		valueOptions
	} from '#lib/timeline/filter/filter.ts';
	import type { LaneField } from '#lib/timeline/types/lane-field.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';

	type Props = {
		artworks: readonly WallArtwork[];
		era: EraCode;
		filter: TimelineFilter;
		showEvents: boolean;
		readingArtworks: boolean;
	};

	const FREQUENT_LIMIT = 8;

	let {
		artworks,
		era,
		filter = $bindable(),
		showEvents = $bindable(),
		readingArtworks = $bindable()
	}: Props = $props();

	let full = $derived(lanesFull(filter));
	let typeTiles = $derived(withCounts(artworkTypeTiles()));

	function withCounts(tiles: ChoiceTile[]): (ChoiceTile & { count: number })[] {
		const counts = new Map(
			valueOptions(artworks, filter, 'types').map((option) => [option.value, option.count])
		);
		return tiles.map((tile) => ({ ...tile, count: counts.get(tile.value) ?? 0 }));
	}

	function unavailable(field: LaneField, value: string): boolean {
		return full && laneIndex(filter, { field, value }) < 0;
	}
</script>

{#snippet swatch(field: LaneField, value: string)}
	{@const index = laneIndex(filter, { field, value })}
	{#if index >= 0}
		<svg style:fill={laneColour(index)} aria-hidden="true" height="8" viewBox="0 0 8 8" width="8">
			<circle cx="4" cy="4" r="4" />
		</svg>
	{/if}
{/snippet}

{#snippet periodSwatch(value: string)}
	{@render swatch('periods', value)}
{/snippet}

{#snippet styleSwatch(value: string)}
	{@render swatch('styles', value)}
{/snippet}

<div class="panel">
	<section class="group">
		<h3>{m.timeline.filters.lanes}</h3>
		<p class="caption" aria-live="polite">
			{full ? m.timeline.filters.lanesFull : m.timeline.filters.lanesHint(eraName(era))}
		</p>
		<FilterValues
			name={(value) => value}
			chosen={chosenLaneValues(filter, 'periods')}
			disabled={(value) => unavailable('periods', value)}
			heading="h4"
			limit={FREQUENT_LIMIT}
			mark={periodSwatch}
			onchoose={(value) => (filter = toggleLane(filter, { field: 'periods', value }))}
			options={laneOptions(artworks, filter, 'periods')}
			title={m.timeline.filters.periods}
		/>
		<FilterValues
			name={(value) => value}
			chosen={chosenLaneValues(filter, 'styles')}
			disabled={(value) => unavailable('styles', value)}
			heading="h4"
			limit={FREQUENT_LIMIT}
			mark={styleSwatch}
			onchoose={(value) => (filter = toggleLane(filter, { field: 'styles', value }))}
			options={laneOptions(artworks, filter, 'styles')}
			title={m.timeline.filters.styles}
		/>
	</section>

	<FavouriteToggle
		count={timelineFavouriteCount(artworks, filter)}
		onclick={() => (filter = toggleTimelineFavourites(filter))}
		pressed={filter.favourites}
	/>

	<ToggleTiles
		columns={2}
		label={m.timeline.filters.types}
		onchange={(values) => (filter = { ...filter, types: values as ArtworkTypeCode[] })}
		options={typeTiles}
		values={filter.types}
	/>

	<FilterValues
		name={(value) => optionLabel('authors', value)}
		chosen={filter.unknownAuthor ? [...filter.authors, UNKNOWN_AUTHOR] : filter.authors}
		limit={FREQUENT_LIMIT}
		onchoose={(value) => (filter = toggleAuthor(filter, value))}
		options={valueOptions(artworks, filter, 'authors')}
		searchLabel={m.timeline.filters.searchAuthors}
		title={m.timeline.filters.authors}
	/>

	<section class="group">
		<h3>{m.timeline.filters.view}</h3>
		<div class="switches">
			<Switch label={m.timeline.filters.events} bind:checked={showEvents} />
			<Switch label={m.timeline.filters.readingArtworks} bind:checked={readingArtworks} />
		</div>
	</section>
</div>

<style>
	.panel {
		display: grid;
		gap: var(--spacing-8);
	}

	.group {
		display: grid;
		gap: var(--spacing-3);
	}

	.switches {
		display: grid;
		justify-items: start;
		gap: var(--spacing-3);
	}

	h3 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}
</style>
