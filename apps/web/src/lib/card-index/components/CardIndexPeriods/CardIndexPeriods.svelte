<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import CardIndexStyles from '#lib/card-index/components/CardIndexStyles/CardIndexStyles.svelte';
	import type { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import type { CardIndexPeriod } from '#lib/card-index/types/card-index-period.ts';

	type Props = {
		periods: CardIndexPeriod[];
		folding: TimelineFolding;
	};

	let { periods, folding }: Props = $props();

	const uid = $props.id();
</script>

<ul class="periods">
	{#each periods as period (period.id)}
		{@const hasStyles = period.styles.length > 0}
		{@const open = hasStyles && folding.isPeriodOpen(period.id)}
		<li>
			<div class="row">
				{#if hasStyles}
					<button
						class="chevron"
						aria-controls="{uid}-{period.id}-styles"
						aria-expanded={open}
						aria-labelledby="{uid}-{period.id}-name"
						onclick={() => folding.togglePeriod(period.id)}
						type="button"
					>
						<Icon icon={ChevronRight} size="sm" />
					</button>
				{:else}
					<span class="chevron"></span>
				{/if}
				<a
					class="record"
					aria-label={m.cardIndex.openValue(period.name, m.atelier.count(period.count))}
					href={valuePath('period', period.id)}
				>
					<span id="{uid}-{period.id}-name" class="name">{period.name}</span>
					<span class="count">{m.atelier.count(period.count)}</span>
				</a>
			</div>
			{#if open}
				<CardIndexStyles id="{uid}-{period.id}-styles" nested styles={period.styles} />
			{/if}
		</li>
	{/each}
</ul>

<style>
	.periods {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.periods > li {
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.periods > li:last-child {
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.row {
		display: grid;
		grid-template-columns: var(--spacing-6) minmax(0, 1fr);
		gap: var(--spacing-2);
	}

	@media (prefers-reduced-motion: no-preference) {
		.row {
			transition: background var(--duration-short) ease-out;
		}

		.chevron > :global(svg) {
			transition: transform var(--duration-short) ease-out;
		}
	}

	.row:hover {
		background: var(--color-tag);
	}

	.chevron {
		display: grid;
		place-items: center;
		padding: 0;
		border: none;
		background: none;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.chevron:hover {
		color: var(--color-fg);
	}

	.chevron[aria-expanded='true'] > :global(svg) {
		transform: rotate(90deg);
	}

	.record {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
		padding: var(--spacing-3);
		padding-inline-start: 0;
		color: var(--color-fg);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
		text-decoration: none;
	}

	.name {
		min-width: 0;
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
