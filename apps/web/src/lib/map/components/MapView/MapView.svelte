<script lang="ts">
	import MapIcon from '@lucide/svelte/icons/map';
	import { onMount, untrack } from 'svelte';
	import {
		Alert,
		Button,
		EmptyState,
		PageHeader,
		ToggleTag,
		overlayScrollbar
	} from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import CityPanel from '#lib/map/components/CityPanel/CityPanel.svelte';
	import FillPanel from '#lib/map/components/FillPanel/FillPanel.svelte';
	import WorldMap from '#lib/map/components/WorldMap/WorldMap.svelte';
	import { MAP_FILTERS } from '#lib/map/map-cities/map-cities.ts';
	import { MapState } from '#lib/map/map-state/map-state.svelte.ts';
	import type { MapPlace } from '#lib/map/types/map-place.ts';
	import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';

	type Props = {
		places: MapPlace[];
		artworks: WallArtwork[];
		images: WallImages;
	};

	let { places, artworks, images }: Props = $props();

	const view = new MapState(
		untrack(() => places),
		() => artworks
	);

	let placed = $derived(view.places.some((place) => place.point));
	let emptyFilter = $derived(
		view.filter === 'wantToSee'
			? m.map.emptyWantToSee
			: view.filter === 'seen'
				? m.map.emptySeen
				: undefined
	);

	onMount(() => {
		void view.load();
	});
</script>

<div class="map-view">
	<PageHeader lead={m.map.lead} />

	{#if view.geographyFailed}
		<Alert tone="danger">
			{m.map.loadError}
		</Alert>
	{/if}

	{#if view.missing.length > 0 && !view.filling}
		<div class="missing">
			<p>{m.map.missing(view.missing.length)}</p>
			<Button onclick={() => view.startFilling()}>
				{m.map.fillStart}
			</Button>
		</div>
	{/if}

	{#if !placed && !view.filling}
		<EmptyState icon={MapIcon} text={m.map.empty} title={m.map.emptyTitle} />
	{:else}
		{#if !view.filling}
			<div class="filters" aria-label={m.map.filtersLabel} role="group">
				{#each MAP_FILTERS as key (key)}
					<ToggleTag
						count={view.counts[key]}
						bind:pressed={() => view.filter === key, (pressed) => pressed && view.setFilter(key)}
					>
						{m.map.filters[key]}
					</ToggleTag>
				{/each}
			</div>
		{/if}
		<div class="split">
			<div class="stage">
				{#if !view.filling && view.cities.length === 0 && emptyFilter}
					<p class="note">{emptyFilter}</p>
				{/if}
				{#if view.geography}
					<WorldMap
						cities={view.cities}
						fit={view.fit}
						geography={view.geography}
						marker={view.choice?.point}
						onpick={view.filling ? (point) => view.pick(point) : undefined}
						onselect={(city) => view.select(city)}
						selected={view.selectedKey}
					/>
				{/if}
			</div>
			{#if view.filling}
				<aside {@attach overlayScrollbar()}>
					<FillPanel
						choice={view.choice}
						current={view.current}
						error={view.saveError}
						left={view.queue.length}
						onchoose={(choice) => view.choose(choice)}
						onclose={() => view.stopFilling()}
						onsave={() => void view.save()}
						onskip={() => view.skip()}
						saving={view.saving}
					/>
				</aside>
			{:else if view.selected}
				<aside {@attach overlayScrollbar()}>
					<CityPanel
						city={view.selected}
						filter={view.filter}
						{images}
						onclose={() => (view.selectedKey = undefined)}
					/>
				</aside>
			{/if}
		</div>
	{/if}
</div>

<style>
	.map-view {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		height: calc(
			100dvh - var(--bar-height) - var(--spacing-6) - var(--spacing-12) - var(--bottom-inset)
		);
		min-height: calc(var(--size-control) * 10);
	}

	.missing {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3) var(--spacing-6);
		padding: var(--spacing-3) var(--spacing-4);
		background: var(--color-tag);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.split {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--spacing-6);
		min-height: 0;
	}

	.stage {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--spacing-3);
		min-width: 0;
		min-height: 0;
	}

	.note {
		color: var(--color-fg-muted);
	}

	aside {
		flex: none;
		max-height: 50%;
		overflow-y: auto;
	}

	@media (min-width: 768px) {
		.map-view {
			height: calc(100dvh - var(--bar-height) - var(--spacing-8) - var(--spacing-12));
		}

		.split {
			flex-direction: row;
			gap: var(--spacing-8);
		}

		aside {
			width: 320px;
			max-height: none;
		}
	}
</style>
