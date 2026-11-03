<script lang="ts">
	import type { BarRow } from '#lib/statistics/types/bar-row.ts';

	type Props = {
		rows: BarRow[];
		faint?: boolean;
		max?: number;
	};

	let { rows, faint = false, max }: Props = $props();

	let scale = $derived(max ?? Math.max(1, ...rows.map((row) => row.count)));
</script>

<ul class:faint>
	{#each rows as row (row.key)}
		<li class:muted={row.muted}>
			{#if row.href}
				<a class="name" href={row.href} title={row.name}>{row.name}</a>
			{:else}
				<span class="name" title={row.name}>{row.name}</span>
			{/if}
			<span class="track" aria-hidden="true">
				<span style:width="{(100 * row.count) / scale}%" class="fill"></span>
			</span>
			<span class="count">{row.count}</span>
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		gap: var(--spacing-2);
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--spacing-1) var(--spacing-3);
		align-items: center;
		font-size: var(--font-size-sm);
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.track {
		grid-column: 1 / -1;
		grid-row: 2;
		height: var(--spacing-2);
		background: var(--color-tag);
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--color-fg);
	}

	.count {
		font-variant-numeric: tabular-nums;
		text-align: end;
	}

	.muted .name,
	.muted .count {
		color: var(--color-fg-muted);
	}

	.muted .fill,
	.faint .fill {
		background: var(--color-fg-muted);
	}

	@media (min-width: 768px) {
		li {
			grid-template-columns: minmax(0, 14rem) 1fr 3rem;
		}

		.track {
			grid-column: auto;
			grid-row: auto;
		}
	}
</style>
