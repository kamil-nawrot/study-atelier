<script lang="ts">
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		image: string;
		large: string;
		sourceWidth: number;
		onclose: () => void;
	};

	const SIZE = 220;
	const MIN_LEVEL = 1.5;
	const START_LEVEL = 2;
	const STEP = 1;

	let { image, large, sourceWidth, onclose }: Props = $props();

	let width = $state(0);
	let height = $state(0);
	let point = $state<{ x: number; y: number }>();
	let chosen = $state(START_LEVEL);
	let loaded = $state<string>();

	let maxLevel = $derived(width > 0 ? sourceWidth / width : MIN_LEVEL);
	let level = $derived(Math.max(MIN_LEVEL, Math.min(chosen, maxLevel)));
	let src = $derived(loaded === large ? large : image);

	$effect(() => {
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

	function follow(event: PointerEvent): void {
		if (event.pointerType !== 'mouse') return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
	}

	function zoom(node: HTMLElement): () => void {
		const listener = (event: WheelEvent): void => {
			event.preventDefault();
			const next = level + (event.deltaY < 0 ? STEP : -STEP);
			chosen = Math.max(MIN_LEVEL, Math.min(maxLevel, next));
		};
		node.addEventListener('wheel', listener, { passive: false });
		return () => node.removeEventListener('wheel', listener);
	}

	function close(event: KeyboardEvent): void {
		if (event.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={close} />

<div
	class="loupe"
	{@attach zoom}
	aria-hidden="true"
	onpointerdown={follow}
	onpointerleave={() => (point = undefined)}
	onpointermove={follow}
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	{#if point}
		<div
			style:left="{point.x - SIZE / 2}px"
			style:top="{point.y - SIZE / 2}px"
			style:width="{SIZE}px"
			style:height="{SIZE}px"
			class="lens"
		>
			<div
				style:background-image="url({JSON.stringify(src)})"
				style:background-size="{width * level}px {height * level}px"
				style:background-position="{SIZE / 2 - point.x * level}px {SIZE / 2 - point.y * level}px"
				class="glass"
			></div>
			<svg class="ring" viewBox="0 0 {SIZE} {SIZE}">
				<circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} />
			</svg>
			<span class="level">{m.loupe.level(level)}</span>
		</div>
	{/if}
</div>

<style>
	.loupe {
		position: absolute;
		inset: 0;
		z-index: 2;
		cursor: none;
	}

	.lens {
		position: absolute;
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
