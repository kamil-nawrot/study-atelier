<script lang="ts">
	import {
		artworkImageSource,
		artworkLargeSource
	} from '#lib/images/artwork-image/artwork-image.ts';
	import LoupeLens from '#lib/images/components/LoupeLens/LoupeLens.svelte';
	import { LOUPE_SIZE, loupeLevel } from '#lib/images/loupe/loupe.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

	type Props = {
		image: ArtworkImageInput;
		x: number;
		y: number;
		viewWidth: number;
		shownWidth?: number;
	};

	const PAGE_WIDTH = 960;

	let { image, x, y, viewWidth, shownWidth }: Props = $props();

	let room = $state(LOUPE_SIZE);

	let source = $derived(artworkImageSource(image, PAGE_WIDTH));
	let large = $derived(artworkLargeSource(image)?.src);
	let ratio = $derived(image.width && image.height ? image.height / image.width : 1);
	let size = $derived(room > 0 ? Math.min(LOUPE_SIZE, room) : LOUPE_SIZE);
	let width = $derived(size / viewWidth);
	let level = $derived(shownWidth ? loupeLevel(viewWidth, shownWidth) : undefined);
</script>

<div style:max-width="{LOUPE_SIZE}px" class="view" bind:clientWidth={room}>
	{#if source}
		<LoupeLens
			height={width * ratio}
			image={source.src}
			{large}
			{level}
			{size}
			{width}
			x={size / 2 - x * width}
			y={size / 2 - y * width * ratio}
		/>
	{/if}
</div>

<style>
	.view {
		display: grid;
		justify-items: center;
		width: 100%;
	}
</style>
