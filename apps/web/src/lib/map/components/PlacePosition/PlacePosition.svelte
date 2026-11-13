<script lang="ts">
	import { Alert } from '@study-atelier/ui';
	import { countryName, isCountryCode } from '#lib/catalogue/countries/countries.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import WorldMap from '#lib/map/components/WorldMap/WorldMap.svelte';
	import { loadGeography } from '#lib/map/geography/geography.ts';
	import { nearestTown } from '#lib/map/towns/towns.ts';
	import type { Geography } from '#lib/map/types/geography.ts';
	import type { PlacePoint } from '#lib/map/types/place-point.ts';

	type Props = {
		point: PlacePoint | null;
	};

	let { point }: Props = $props();

	let geography = $state<Geography>();
	let failed = $state(false);

	let town = $derived(point && geography ? nearestTown(point, geography.towns) : null);
	let townLine = $derived(
		town
			? [town.name, isCountryCode(town.countryCode) ? countryName(town.countryCode) : null]
					.filter(Boolean)
					.join(', ')
			: ''
	);

	$effect(() => {
		if (!point || geography || failed) return;
		loadGeography().then(
			(loaded) => (geography = loaded),
			() => (failed = true)
		);
	});
</script>

<section class="position" aria-labelledby="position-title">
	<h2 id="position-title" class="overline">{m.map.position.title}</h2>
	{#if !point}
		<p class="empty">{m.map.position.empty}</p>
	{:else if failed}
		<Alert tone="danger">
			{m.map.loadError}
		</Alert>
	{:else if geography}
		<div class="frame">
			<WorldMap fit={[point]} {geography} marker={point} wholeWorld />
		</div>
		{#if townLine}
			<p class="caption">{townLine}</p>
		{/if}
	{/if}
</section>

<style>
	.position {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
	}

	.empty,
	.caption {
		color: var(--color-fg-muted);
	}

	.caption {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.frame {
		display: flex;
		flex-direction: column;
		aspect-ratio: 4 / 3;
	}

	@media (min-width: 768px) {
		.frame {
			aspect-ratio: 1;
		}
	}
</style>
