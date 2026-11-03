<script lang="ts">
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import { Button, EmptyState } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import HoldingsSection from '#lib/statistics/components/HoldingsSection/HoldingsSection.svelte';
	import { holdingsOf } from '#lib/statistics/holdings/holdings.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

	type Props = {
		artworks: WallArtwork[];
		statistics: CollectionStatistics;
	};

	let { artworks, statistics }: Props = $props();

	let holdings = $derived(holdingsOf(artworks));
</script>

{#if artworks.length === 0}
	<EmptyState icon={ChartColumn} text={m.statistics.empty} title={m.statistics.emptyTitle}>
		<Button href={resolve('/(app)/atelier/new')}>{m.statistics.addArtwork}</Button>
	</EmptyState>
{:else}
	<div class="view">
		<header>
			<h1>{m.statistics.title}</h1>
			<p class="lead">{m.statistics.lead}</p>
		</header>
		<HoldingsSection {holdings} {statistics} />
	</div>
{/if}

<style>
	.view {
		display: grid;
		gap: var(--spacing-12);
		max-width: var(--size-content-default);
	}

	header {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
