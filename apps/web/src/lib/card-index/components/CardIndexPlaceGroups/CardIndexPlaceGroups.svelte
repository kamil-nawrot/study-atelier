<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { placeTypeIcon, placeTypeName } from '#lib/catalogue/place-types/place-types.ts';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import CardIndexPlaceRows from '#lib/card-index/components/CardIndexPlaceRows/CardIndexPlaceRows.svelte';
	import type { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import type { CardIndexPlaceGroup } from '#lib/card-index/types/card-index-place-group.ts';

	type Props = {
		groups: CardIndexPlaceGroup[];
		folding: TimelineFolding;
	};

	let { groups, folding }: Props = $props();

	const uid = $props.id();
</script>

<ul class="groups">
	{#each groups as group (group.id)}
		{@const hasPlaces = group.places.length > 0}
		{@const open = hasPlaces && folding.isPeriodOpen(group.id)}
		<li>
			<div class="row">
				{#if hasPlaces}
					<button
						class="chevron"
						aria-controls="{uid}-{group.id}-places"
						aria-expanded={open}
						aria-labelledby="{uid}-{group.id}-name"
						onclick={() => folding.togglePeriod(group.id)}
						type="button"
					>
						<Icon icon={ChevronRight} size="sm" />
					</button>
				{:else if !group.city && group.placeType}
					<span class="chevron" title={placeTypeName(group.placeType)}>
						<Icon icon={placeTypeIcon(group.placeType)} size="sm" />
					</span>
				{:else}
					<span class="chevron"></span>
				{/if}
				<a
					class={['record', { city: group.city }]}
					aria-label={m.cardIndex.openValue(group.name, m.atelier.count(group.count))}
					href={valuePath('location', group.id)}
				>
					<span id="{uid}-{group.id}-name" class="name">
						{group.name}
					</span>
					<span class="count">{m.atelier.count(group.count)}</span>
				</a>
			</div>
			{#if open}
				<CardIndexPlaceRows id="{uid}-{group.id}-places" nested places={group.places} />
			{/if}
		</li>
	{/each}
</ul>

<style>
	.groups {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.groups > li {
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.groups > li:last-child {
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
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-lg);
		text-decoration: none;
	}

	.city {
		font-weight: var(--font-weight-bold);
	}

	.name {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
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
