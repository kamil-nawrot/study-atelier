<script lang="ts">
	import { ticksOf, type Column } from '#lib/statistics/acquisitions/acquisitions.ts';

	type Props = {
		columns: Column[];
		label: string;
		describe: (column: Column) => string;
	};

	let { columns, label, describe }: Props = $props();

	const WIDTH = 640;
	const HEIGHT = 200;
	const LEFT = 36;
	const BOTTOM = 24;
	const TOP = 8;

	let active = $state<number>();

	let ticks = $derived(ticksOf(Math.max(1, ...columns.map((column) => column.added))));
	let top = $derived(ticks[ticks.length - 1]);
	let step = $derived((WIDTH - LEFT) / Math.max(1, columns.length));

	function y(value: number): number {
		return TOP + (HEIGHT - TOP - BOTTOM) * (1 - value / top);
	}
</script>

<div class="chart">
	<svg aria-label={label} role="group" viewBox="0 0 {WIDTH} {HEIGHT}">
		{#each ticks as tick (tick)}
			<line class="grid" x1={LEFT} x2={WIDTH} y1={y(tick)} y2={y(tick)} />
			<text class="tick" text-anchor="end" x={LEFT - 8} y={y(tick) + 4}>{tick}</text>
		{/each}
		{#each columns as column, index (column.start)}
			{@const x = LEFT + index * step}
			{#if column.added > 0}
				<rect
					class="column"
					class:active={active === index}
					aria-label={describe(column)}
					height={y(0) - y(column.added)}
					onblur={() => (active = undefined)}
					onclick={() => (active = index)}
					onfocus={() => (active = index)}
					onkeydown={(event) => event.key === 'Enter' && (active = index)}
					onpointerenter={() => (active = index)}
					onpointerleave={() => (active = undefined)}
					role="button"
					tabindex="0"
					width={step * 0.7}
					x={x + step * 0.15}
					y={y(column.added)}
				/>
			{/if}
			{#if column.label}
				<text class="tick" text-anchor="middle" x={x + step / 2} y={HEIGHT - 6}>{column.label}</text
				>
			{/if}
		{/each}
	</svg>
	{#if active !== undefined}
		<span
			style:left="{((LEFT + (active + 0.5) * step) / WIDTH) * 100}%"
			style:top="{(y(columns[active].added) / HEIGHT) * 100}%"
			class="tooltip"
			aria-hidden="true">{describe(columns[active])}</span
		>
	{/if}
</div>

<style>
	.chart {
		position: relative;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.grid {
		stroke: var(--color-tag);
		stroke-width: var(--border-width-hairline);
	}

	.tick {
		fill: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-family: inherit;
	}

	.column {
		fill: var(--color-fg);
		outline: none;
	}

	.column.active,
	.column:focus-visible {
		fill: var(--color-fg-muted);
	}

	.tooltip {
		position: absolute;
		transform: translate(-50%, calc(-100% - var(--spacing-2)));
		padding: var(--spacing-1) var(--spacing-2);
		background: var(--color-fg);
		color: var(--color-on-fg);
		font-size: var(--font-size-xs);
		white-space: nowrap;
		pointer-events: none;
	}
</style>
