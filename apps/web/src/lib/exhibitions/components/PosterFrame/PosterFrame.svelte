<script lang="ts">
	import { NoImage } from '@study-atelier/ui';
	import PosterImage from '#lib/exhibitions/components/PosterImage/PosterImage.svelte';
	import {
		CENTRED_CROP,
		draggedCrop,
		movedCrop,
		type Size
	} from '#lib/exhibitions/exhibition-poster/exhibition-poster.ts';
	import type { PosterCrop } from '#lib/exhibitions/types/poster-crop.ts';
	import type { PosterFilters } from '#lib/exhibitions/types/poster-filters.ts';
	import type { PosterImage as PosterPicture } from '#lib/exhibitions/types/poster-image.ts';

	type Props = {
		picture?: PosterPicture;
		crop: PosterCrop | null;
		filters: PosterFilters;
		label: string;
		hintId: string;
		oncrop: (crop: PosterCrop) => void;
	};

	const KEY_STEP = 0.05;
	const KEY_MOVES: Record<string, [number, number]> = {
		ArrowLeft: [-KEY_STEP, 0],
		ArrowRight: [KEY_STEP, 0],
		ArrowUp: [0, -KEY_STEP],
		ArrowDown: [0, KEY_STEP]
	};

	let { picture, crop, filters, label, hintId, oncrop }: Props = $props();

	let width = $state(0);
	let height = $state(0);
	let natural = $state<Size>();
	let pointer: { id: number; x: number; y: number } | undefined;

	function loaded(event: Event): void {
		const image = (event.currentTarget as HTMLElement).querySelector('img');
		if (image) natural = { width: image.naturalWidth, height: image.naturalHeight };
	}

	function down(event: PointerEvent): void {
		if (!picture) return;
		pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function move(event: PointerEvent): void {
		if (!pointer || pointer.id !== event.pointerId || !natural) return;
		const dx = event.clientX - pointer.x;
		const dy = event.clientY - pointer.y;
		pointer = { ...pointer, x: event.clientX, y: event.clientY };
		oncrop(draggedCrop(crop ?? CENTRED_CROP, dx, dy, { width, height }, natural));
	}

	function up(event: PointerEvent): void {
		if (pointer?.id === event.pointerId) pointer = undefined;
	}

	function key(event: KeyboardEvent): void {
		const step = KEY_MOVES[event.key];
		if (!step || !picture) return;
		event.preventDefault();
		oncrop(movedCrop(crop ?? CENTRED_CROP, step[0], step[1]));
	}
</script>

<button
	class="frame"
	aria-describedby={hintId}
	aria-label={label}
	onkeydown={key}
	onloadcapture={loaded}
	onlostpointercapture={up}
	onpointercancel={up}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	type="button"
	bind:clientHeight={height}
	bind:clientWidth={width}
>
	{#if picture}
		<PosterImage {crop} {filters} sizes="400px" src={picture.src} srcset={picture.srcset} />
	{:else}
		<NoImage />
	{/if}
</button>

<style>
	.frame {
		display: grid;
		width: 100%;
		padding: 0;
		border: 0;
		aspect-ratio: 4 / 5;
		place-items: center;
		overflow: hidden;
		outline: var(--border-width-base) dashed var(--color-fg-muted);
		outline-offset: var(--spacing-1);
		background: var(--color-mat-window);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.frame:active {
		cursor: grabbing;
	}

	.frame:focus-visible {
		outline-color: var(--color-fg);
	}
</style>
