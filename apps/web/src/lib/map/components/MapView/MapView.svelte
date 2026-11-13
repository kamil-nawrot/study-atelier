<script lang="ts">
	import MapIcon from '@lucide/svelte/icons/map';
	import { onMount, untrack } from 'svelte';
	import {
		Alert,
		EmptyState,
		Icon,
		PageHeader,
		ToggleTag,
		overlayScrollbar
	} from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import CityPanel from '#lib/map/components/CityPanel/CityPanel.svelte';
	import WorldMap from '#lib/map/components/WorldMap/WorldMap.svelte';
	import { MAP_FILTER_ICONS, MAP_FILTERS } from '#lib/map/map-cities/map-cities.ts';
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

	{#if !view.placed}
		<EmptyState icon={MapIcon} text={m.map.empty} title={m.map.emptyTitle} />
	{:else}
		<div class="filters" aria-label={m.map.filtersLabel} role="group">
			{#each MAP_FILTERS as key (key)}
				<ToggleTag
					count={view.counts[key]}
					bind:pressed={() => view.filter === key, (pressed) => pressed && view.setFilter(key)}
				>
					<Icon icon={MAP_FILTER_ICONS[key]} size="sm" />
					{m.map.filters[key]}
				</ToggleTag>
			{/each}
		</div>
		<div class="split">
			<div class="stage">
				{#if view.geography}
					<WorldMap
						cities={view.cities}
						fit={view.fit}
						geography={view.geography}
						onselect={(city) => view.select(city)}
						selected={view.selectedKey}
					/>
				{/if}
			</div>
			{#if view.selected}
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
