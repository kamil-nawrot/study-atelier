<script lang="ts">
	import LoupeLens from '#lib/images/components/LoupeLens/LoupeLens.svelte';
	import { LOUPE_MIN_LEVEL, LOUPE_SIZE, LOUPE_START_LEVEL } from '#lib/images/loupe/loupe.ts';
	import type { SharedLoupe } from '#lib/compare/shared-loupe/shared-loupe.svelte.ts';

	type Props = {
		loupe: SharedLoupe;
		image: string;
		large: string;
		sourceWidth: number;
	};

	const STEP = 1;

	let { loupe, image, large, sourceWidth }: Props = $props();

	let width = $state(0);
	let height = $state(0);

	let maxLevel = $derived(width > 0 ? sourceWidth / width : LOUPE_MIN_LEVEL);
	let level = $derived(
		Math.max(LOUPE_MIN_LEVEL, Math.min(loupe.level ?? LOUPE_START_LEVEL, maxLevel))
	);

	function follow(event: PointerEvent): void {
		if (event.pointerType !== 'mouse' || width === 0 || height === 0) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		loupe.level ??= level;
		loupe.spot = {
			x: Math.min(1, Math.max(0, (event.clientX - rect.left) / width)),
			y: Math.min(1, Math.max(0, (event.clientY - rect.top) / height))
		};
	}

	function zoom(node: HTMLElement): () => void {
		const listener = (event: WheelEvent): void => {
			event.preventDefault();
			const next = Math.max(
				LOUPE_MIN_LEVEL,
				Math.min(maxLevel, level + (event.deltaY < 0 ? STEP : -STEP))
			);
			loupe.level = next;
		};
		node.addEventListener('wheel', listener, { passive: false });
		return () => node.removeEventListener('wheel', listener);
	}

	function close(event: KeyboardEvent): void {
		if (event.key === 'Escape' && !document.querySelector('dialog[open]')) loupe.close();
	}

	function leave(event: MouseEvent): void {
		event.preventDefault();
		loupe.close();
	}

	function closeOutside(node: HTMLElement): () => void {
		const listener = (event: PointerEvent): void => {
			const target = event.target as Element | null;
			if (event.button !== 0 || !target || node.contains(target)) return;
			if (target.closest('[data-loupe-toggle], [data-compare-loupe]')) return;
			if (document.querySelector('dialog[open]')) return;
			loupe.close();
		};
		window.addEventListener('pointerdown', listener, true);
		return () => window.removeEventListener('pointerdown', listener, true);
	}
</script>

<svelte:window onkeydown={close} />

<div
	class="loupe"
	{@attach zoom}
	{@attach closeOutside}
	aria-hidden="true"
	data-compare-loupe
	oncontextmenu={leave}
	onpointerdown={follow}
	onpointerleave={() => (loupe.spot = undefined)}
	onpointermove={follow}
	bind:clientHeight={height}
	bind:clientWidth={width}
>
	{#if loupe.spot}
		<div
			style:left="{loupe.spot.x * width - LOUPE_SIZE / 2}px"
			style:top="{loupe.spot.y * height - LOUPE_SIZE / 2}px"
			class="place"
		>
			<LoupeLens
				height={height * level}
				{image}
				{large}
				{level}
				size={LOUPE_SIZE}
				width={width * level}
				x={LOUPE_SIZE / 2 - loupe.spot.x * width * level}
				y={LOUPE_SIZE / 2 - loupe.spot.y * height * level}
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
