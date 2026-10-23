<script lang="ts">
	import { LOUPE_MIN_LEVEL, LOUPE_SIZE, LOUPE_START_LEVEL, loupeViewWidth } from '../loupe.ts';
	import LoupeLens from './LoupeLens.svelte';

	type Props = {
		image: string;
		large: string;
		sourceWidth: number;
		onclose: () => void;
		onpick?: (spot: { x: number; y: number; viewWidth: number }) => void;
	};

	const STEP = 1;

	let { image, large, sourceWidth, onclose, onpick }: Props = $props();

	let width = $state(0);
	let height = $state(0);
	let point = $state<{ x: number; y: number }>();
	let chosen = $state(LOUPE_START_LEVEL);

	let maxLevel = $derived(width > 0 ? sourceWidth / width : LOUPE_MIN_LEVEL);
	let level = $derived(Math.max(LOUPE_MIN_LEVEL, Math.min(chosen, maxLevel)));

	function follow(event: PointerEvent): void {
		if (event.pointerType !== 'mouse') return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
	}

	function zoom(node: HTMLElement): () => void {
		const listener = (event: WheelEvent): void => {
			event.preventDefault();
			const next = level + (event.deltaY < 0 ? STEP : -STEP);
			chosen = Math.max(LOUPE_MIN_LEVEL, Math.min(maxLevel, next));
		};
		node.addEventListener('wheel', listener, { passive: false });
		return () => node.removeEventListener('wheel', listener);
	}

	function pick(): void {
		if (!point || width === 0 || height === 0) return;
		onpick?.({
			x: Math.min(1, Math.max(0, point.x / width)),
			y: Math.min(1, Math.max(0, point.y / height)),
			viewWidth: loupeViewWidth(width, level)
		});
	}

	function close(event: KeyboardEvent): void {
		if (event.key === 'Escape' && !document.querySelector('dialog[open]')) onclose();
	}
</script>

<svelte:window onkeydown={close} />

<div
	class="loupe"
	{@attach zoom}
	aria-hidden="true"
	onclick={pick}
	onpointerdown={follow}
	onpointerleave={() => (point = undefined)}
	onpointermove={follow}
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	{#if point}
		<div
			style:left="{point.x - LOUPE_SIZE / 2}px"
			style:top="{point.y - LOUPE_SIZE / 2}px"
			class="place"
		>
			<LoupeLens
				height={height * level}
				{image}
				{large}
				{level}
				size={LOUPE_SIZE}
				width={width * level}
				x={LOUPE_SIZE / 2 - point.x * level}
				y={LOUPE_SIZE / 2 - point.y * level}
			/>
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

	.place {
		position: absolute;
		pointer-events: none;
	}
</style>
