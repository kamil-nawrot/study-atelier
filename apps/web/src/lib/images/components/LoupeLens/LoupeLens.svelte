<script lang="ts">
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		image: string;
		large?: string;
		size: number;
		width: number;
		height: number;
		x: number;
		y: number;
		level?: number;
	};

	let { image, large, size, width, height, x, y, level }: Props = $props();

	let loaded = $state<string>();
	let src = $derived(large !== undefined && loaded === large ? large : image);

	$effect(() => {
		if (large === undefined) return;
		const target = large;
		const preload = new Image();
		preload.onload = () => {
			loaded = target;
		};
		preload.src = target;
		return () => {
			preload.onload = null;
		};
	});
</script>

<div style:width="{size}px" style:height="{size}px" class="lens">
	<div
		style:background-image="url({JSON.stringify(src)})"
		style:background-size="{width}px {height}px"
		style:background-position="{x}px {y}px"
		class="glass"
	></div>
	<svg class="ring" viewBox="0 0 {size} {size}">
		<circle cx={size / 2} cy={size / 2} r={size / 2} />
	</svg>
	{#if level !== undefined}
		<span class="level">{m.loupe.level(level)}</span>
	{/if}
</div>

<style>
	.lens {
		position: relative;
		pointer-events: none;
	}

	.glass {
		position: absolute;
		inset: 0;
		clip-path: circle(50%);
		background-color: var(--color-stage-bg);
		background-repeat: no-repeat;
	}

	.ring {
		position: absolute;
		inset: 0;
		overflow: visible;
		fill: none;
		stroke: var(--color-mat-bg);
		stroke-width: var(--border-width-heavy);
	}

	.level {
		position: absolute;
		bottom: var(--spacing-4);
		left: 50%;
		padding: 0 var(--spacing-1);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-sm);
		translate: -50% 0;
	}
</style>
