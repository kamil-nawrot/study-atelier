<script lang="ts">
	import { Primer } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

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

	let ready = $state<string>();

	function preload(source: string, onready: (source: string) => void): () => void {
		const probe = new Image();
		probe.onload = () => onready(source);
		probe.src = source;
		return () => {
			probe.onload = null;
		};
	}

	$effect(() => preload(image, (source) => (ready = source)));

	$effect(() => {
		if (large === undefined) return;
		return preload(large, (source) => (loaded = source));
	});

	let waiting = $derived(ready !== src && loaded !== src);
</script>

<div style:width="{size}px" style:height="{size}px" class="lens">
	<div
		style:background-image={waiting ? undefined : `url(${JSON.stringify(src)})`}
		style:background-size="{width}px {height}px"
		style:background-position="{x}px {y}px"
		class="glass"
		aria-busy={waiting}
	>
		{#if waiting}
			<Primer />
		{/if}
	</div>
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
		color: var(--color-stage-fg-muted);
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
