<script lang="ts">
	import CityMarker from '#lib/map/components/CityMarker/CityMarker.svelte';
	import { discReach } from '#lib/map/map-fan/map-fan.ts';
	import type { FannedCity } from '#lib/map/map-groups/map-groups.ts';
	import type { MapCity } from '#lib/map/types/map-city.ts';

	type Props = {
		cities: FannedCity[];
		centre: { x: number; y: number };
		selected?: string;
		narrow: boolean;
		onselect: (city: MapCity) => void;
	};

	let { cities, centre, selected, narrow, onselect }: Props = $props();

	let reach = $derived(discReach(centre, cities));
</script>

<svg class="leaders" aria-hidden="true">
	<circle class="disc" cx={centre.x} cy={centre.y} r={reach} />
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

	.disc {
		fill: color-mix(in srgb, var(--color-bg) 82%, transparent);
		stroke: var(--color-line);
		stroke-width: var(--border-width-hairline);
	}
</style>
