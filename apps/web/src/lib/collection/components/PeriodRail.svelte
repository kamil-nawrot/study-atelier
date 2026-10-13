<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { eraIcon } from '../eras.ts';
	import { railLayout, railRow } from '../period-rail.ts';
	import type { CurrentPeriod, PeriodGroup } from '../types.ts';

	type Props = {
		groups: PeriodGroup[];
		current: CurrentPeriod;
		width: number;
	};

	let { groups, current, width }: Props = $props();

	let height = $state(0);

	let row = $derived(railRow(groups.length, height));
	let entries = $derived(railLayout(groups.length, current, height));
</script>

<aside
	style:width="{width}px"
	class="rail"
	aria-label={m.atelier.periods.label}
	bind:clientHeight={height}
>
	<ol>
		{#each groups as group, index (group.name)}
			<li
				style:height="{row}px"
				style:translate="0 {entries[index].offset}px"
				class={entries[index].state}
				aria-current={entries[index].state === 'current' ? 'true' : undefined}
				title={group.name}
			>
				{#if entries[index].state === 'current'}
					<span class="icon">
						<Icon icon={eraIcon(group.code)} size="sm" />
					</span>
				{/if}
				<span class="name">{group.name}</span>
				<span class="line"></span>
			</li>
		{/each}
	</ol>
</aside>

<style>
	.rail {
		position: fixed;
		top: var(--bar-height);
		right: 0;
		bottom: 0;
		overflow: hidden;
		pointer-events: none;
	}

	ol {
		position: relative;
		height: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		position: absolute;
		inset: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--spacing-2);
		padding-right: var(--spacing-4);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	li.current {
		padding-right: 0;
		color: var(--color-fg);
		font-weight: var(--font-weight-medium);
	}

	.name {
		overflow: hidden;
		text-align: right;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon {
		display: flex;
		flex: none;
	}

	.icon :global(svg) {
		width: var(--font-size-sm);
		height: var(--font-size-sm);
	}

	.line {
		flex: none;
		width: var(--spacing-3);
		height: var(--border-width-base);
		background: currentColor;
	}

	.current .line {
		width: var(--spacing-8);
	}
</style>
