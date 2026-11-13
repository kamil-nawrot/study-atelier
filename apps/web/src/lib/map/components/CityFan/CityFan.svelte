<script lang="ts">
	import CityMarker from '#lib/map/components/CityMarker/CityMarker.svelte';
	import type { FannedCity } from '#lib/map/map-groups/map-groups.ts';
	import type { MapCity } from '#lib/map/types/map-city.ts';

	type Props = {
		cities: FannedCity[];
		selected?: string;
		narrow: boolean;
		onselect: (city: MapCity) => void;
	};

	let { cities, selected, narrow, onselect }: Props = $props();
</script>

<svg class="leaders" aria-hidden="true">
	{#each cities as city (city.key)}
		<line x1={city.from.x} x2={city.x} y1={city.from.y} y2={city.y} />
		<circle cx={city.from.x} cy={city.from.y} r="2.5" />
	{/each}
</svg>
{#each cities as city (city.key)}
	<CityMarker
		group={city}
		labelled
		{narrow}
		onclick={() => onselect(city.cities[0])}
		selected={city.key === selected}
	/>
{/each}

<style>
	.leaders {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	line {
		stroke: var(--color-fg);
		stroke-width: var(--border-width-hairline);
	}

	circle {
		fill: var(--color-fg);
	}
</style>
