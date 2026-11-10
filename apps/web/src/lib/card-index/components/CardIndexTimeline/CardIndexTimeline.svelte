<script lang="ts">
	import ListTree from '@lucide/svelte/icons/list-tree';
	import { EmptyState } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { Snippet } from 'svelte';
	import CardIndexEra from '#lib/card-index/components/CardIndexEra/CardIndexEra.svelte';
	import CardIndexPeriods from '#lib/card-index/components/CardIndexPeriods/CardIndexPeriods.svelte';
	import CardIndexStyles from '#lib/card-index/components/CardIndexStyles/CardIndexStyles.svelte';
	import CardIndexTools from '#lib/card-index/components/CardIndexTools/CardIndexTools.svelte';
	import {
		narrowTimeline,
		periodsWithMatchingStyles
	} from '#lib/card-index/timeline-search/timeline-search.ts';
	import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import { sortsOf, type CardIndexSort } from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import type { CardIndexTimeline } from '#lib/card-index/types/card-index-timeline.ts';

	type Props = {
		timeline: CardIndexTimeline;
		query?: string;
		sort?: CardIndexSort;
		actions?: Snippet;
	};

	let {
		timeline: full,
		query = $bindable(''),
		sort = $bindable('name'),
		actions
	}: Props = $props();

	let timeline = $derived(narrowTimeline(full, query, sort));
	let matched = $derived(periodsWithMatchingStyles(timeline, query));
	let isEmpty = $derived(!filled(full));
	let hasEras = $derived(timeline.eras.some((era) => era.periods.length > 0));
	let hasOutside = $derived(
		timeline.periodsWithoutEra.length > 0 || timeline.stylesWithoutPeriod.length > 0
	);

	let periods = $derived(
		[...full.eras.flatMap((era) => era.periods), ...full.periodsWithoutEra].map(
			(period) => period.id
		)
	);

	const folding = new TimelineFolding(() => ({ query, matched, periods }));

	function filled(shown: CardIndexTimeline): boolean {
		return (
			shown.eras.some((era) => era.periods.length > 0) ||
			shown.periodsWithoutEra.length > 0 ||
			shown.stylesWithoutPeriod.length > 0
		);
	}
</script>

{#if isEmpty}
	{#if actions}
		<div class="solo">{@render actions()}</div>
	{/if}
	<EmptyState icon={ListTree} text={m.cardIndex.emptyTimeline} />
{:else}
	<div class="timeline">
		<CardIndexTools
			{actions}
			searchLabel={m.cardIndex.search.timeline}
			sorts={sortsOf('timeline')}
			bind:query
			bind:sort
		/>
		{#if !filled(timeline)}
			<p class="lead">{m.cardIndex.noResults(query.trim())}</p>
		{/if}
		{#if hasEras}
			<ol class="eras">
				{#each timeline.eras as era (era.code)}
					<CardIndexEra {era} {folding} />
				{/each}
			</ol>
		{/if}
		{#if hasOutside}
			<div class={['outside', { divided: hasEras }]}>
				{#if timeline.periodsWithoutEra.length > 0}
					<section class="group">
						<h2 class="group-title">{m.cardIndex.periodsWithoutEra}</h2>
						<CardIndexPeriods {folding} periods={timeline.periodsWithoutEra} />
					</section>
				{/if}
				{#if timeline.stylesWithoutPeriod.length > 0}
					<section class="group">
						<h2 class="group-title">{m.cardIndex.stylesWithoutPeriod}</h2>
						<CardIndexStyles styles={timeline.stylesWithoutPeriod} />
					</section>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.solo {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-3);
	}

	.timeline {
		display: grid;
		gap: var(--spacing-6);
	}

	.eras {
		position: relative;
		display: grid;
		gap: var(--spacing-8);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.eras::before {
		content: '';
		position: absolute;
		top: var(--spacing-6);
		bottom: var(--spacing-6);
		left: var(--spacing-6);
		border-left: var(--border-width-hairline) solid var(--color-line);
	}

	.outside {
		display: grid;
		gap: var(--spacing-8);
	}

	.outside.divided {
		padding-top: var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.group {
		display: grid;
		gap: var(--spacing-2);
	}

	.group-title {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		font-variant-caps: all-small-caps;
		letter-spacing: var(--letter-spacing-wide);
		line-height: var(--line-height-sm);
	}
</style>
