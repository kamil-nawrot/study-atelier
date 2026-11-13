<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import type { CityGroup } from '#lib/map/map-groups/map-groups.ts';

	type Props = {
		group: CityGroup;
		selected: boolean;
		labelled: boolean;
		narrow: boolean;
		onclick: () => void;
	};

	let { group, selected, labelled, narrow, onclick }: Props = $props();

	let single = $derived(group.cities.length === 1);
	let label = $derived(
		single
			? `${group.cities[0].name}, ${m.map.city.artworks(group.count)}`
			: m.map.group(
					group.cities.map((city) => city.name),
					group.count
				)
	);
</script>

<button
	style:left="{group.x}px"
	style:top="{group.y}px"
	style:--city-size="{group.radius * 2}px"
	class="city"
	class:labelled={labelled || selected}
	class:narrow
	class:seen={group.seen > 0}
	class:selected
	aria-label={label}
	aria-pressed={single ? selected : undefined}
	{onclick}
	type="button"
>
	<span class="disc">
		<svg aria-hidden="true" viewBox="0 0 2 2"><circle cx="1" cy="1" r="0.94" /></svg>
		<span class="count">{group.count}</span>
	</span>
	{#if single}
		<span class="name">{group.cities[0].name}</span>
	{/if}
</button>

<style>
	.city {
		position: absolute;
		display: grid;
		justify-items: center;
		gap: var(--spacing-1);
		padding: 0;
		border: none;
		background: none;
		color: var(--color-fg);
		font: inherit;
		cursor: pointer;
		transform: translate(-50%, calc(var(--city-size) / -2));
	}

	.city:hover,
	.city:focus-visible {
		z-index: 1;
	}

	.disc {
		display: grid;
		width: var(--city-size);
		height: var(--city-size);
	}

	.disc > * {
		grid-area: 1 / 1;
	}

	.disc svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.disc circle {
		fill: var(--color-bg);
		stroke: var(--color-fg);
		stroke-width: 0.12;
	}

	.count {
		place-self: center;
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		font-weight: var(--font-weight-medium);
		line-height: 1;
	}

	.seen circle,
	.selected circle {
		fill: var(--color-highlight);
		stroke: var(--color-highlight);
	}

	.selected circle {
		stroke: var(--color-fg);
	}

	.seen .count,
	.selected .count {
		color: var(--color-on-fg);
	}

	.city:focus-visible .disc {
		outline: var(--border-width-base) solid var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.city:focus-visible {
		outline: none;
	}

	.name {
		visibility: hidden;
		padding: 0 var(--spacing-1);
		background: color-mix(in srgb, var(--color-tag) 80%, transparent);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
		font-style: italic;
		line-height: var(--line-height-xs);
		white-space: nowrap;
	}

	.labelled .name,
	.city:hover .name,
	.city:focus-visible .name {
		visibility: visible;
	}

	.narrow .name {
		font-size: var(--font-size-sm);
	}
</style>
