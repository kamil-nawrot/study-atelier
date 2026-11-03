<script lang="ts">
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import { Button, EmptyState } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AcquisitionsSection from '#lib/statistics/components/AcquisitionsSection/AcquisitionsSection.svelte';
	import BlanksSection from '#lib/statistics/components/BlanksSection/BlanksSection.svelte';
	import CompositionSection from '#lib/statistics/components/CompositionSection/CompositionSection.svelte';
	import ForegroundSection from '#lib/statistics/components/ForegroundSection/ForegroundSection.svelte';
	import MemorySection from '#lib/statistics/components/MemorySection/MemorySection.svelte';
	import OdditiesSection from '#lib/statistics/components/OdditiesSection/OdditiesSection.svelte';
	import HoldingsSection from '#lib/statistics/components/HoldingsSection/HoldingsSection.svelte';
	import { dimensionsOf } from '#lib/statistics/dimensions/dimensions.ts';
	import { holdingsOf } from '#lib/statistics/holdings/holdings.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ReviewCard } from '#lib/review/types/review-card.ts';
	import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

	type Props = {
		artworks: WallArtwork[];
		statistics: CollectionStatistics;
		ownFields?: OwnFieldDefinition[];
		cards?: Map<string, ReviewCard>;
	};

	let { artworks, statistics, ownFields, cards = new Map() }: Props = $props();

	let holdings = $derived(holdingsOf(artworks));
	let dimensions = $derived(dimensionsOf(ownFields));
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
		<CompositionSection {artworks} {dimensions} />
		<ForegroundSection {artworks} {dimensions} />
		<BlanksSection {artworks} />
		<OdditiesSection {artworks} {statistics} />
		<MemorySection {artworks} {cards} {statistics} />
		{#if statistics.growth}
			<AcquisitionsSection growth={statistics.growth} />
		{/if}
	</div>
{/if}

<style>
	.view {
		display: grid;
		gap: var(--spacing-12);
		max-width: var(--size-content-wide);
	}

	header {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
