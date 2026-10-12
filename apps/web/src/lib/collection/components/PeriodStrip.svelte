<script lang="ts">
	import { m } from '#lib/i18n/index.ts';
	import { formatYearRange } from '../format.ts';
	import type { CurrentPeriod } from '../period-rail.ts';
	import type { PeriodGroup } from '../periods.ts';

	type Props = {
		groups: PeriodGroup[];
		current: CurrentPeriod;
	};

	let { groups, current }: Props = $props();

	let period = $derived(groups[current.index]);
	let years = $derived(period ? formatYearRange(period.from, period.to) : undefined);
</script>

{#if period}
	<aside class="strip" aria-label={m.atelier.periods.label}>
		<p class="current">
			<span class="name">{period.name}</span>
			{#if years}
				<span class="caption">{years}</span>
			{/if}
		</p>
		<ol aria-hidden="true">
			{#each groups as group, index (group.name)}
				<li class:current={index === current.index}></li>
			{/each}
		</ol>
	</aside>
{/if}

<style>
	.strip {
		position: sticky;
		top: var(--bar-height);
		z-index: 1;
		display: grid;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--page-inline) var(--spacing-3);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.current {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-3);
		margin: 0;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.name {
		font-weight: var(--font-weight-medium);
	}

	ol {
		display: flex;
		gap: var(--spacing-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		flex: 1;
		max-width: var(--spacing-6);
		height: var(--border-width-button);
		background: var(--color-line);
	}

	li.current {
		flex: 3;
		max-width: var(--spacing-12);
		background: var(--color-fg);
	}
</style>
