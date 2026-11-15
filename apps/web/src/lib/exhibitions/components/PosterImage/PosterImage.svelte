<script lang="ts">
	import { posterFilter } from '#lib/exhibitions/exhibition-poster/exhibition-poster.ts';
	import type { PosterCrop } from '#lib/exhibitions/types/poster-crop.ts';
	import type { PosterFilters } from '#lib/exhibitions/types/poster-filters.ts';

	type Props = {
		src: string;
		srcset?: string;
		sizes?: string;
		crop?: PosterCrop | null;
		filters?: PosterFilters;
		lazy?: boolean;
		onerror?: () => void;
	};

	let { src, srcset, sizes, crop = null, filters, lazy = false, onerror }: Props = $props();

	const position = $derived(crop ? `${crop.x * 100}% ${crop.y * 100}%` : undefined);
</script>

<img
	style:filter={filters ? posterFilter(filters) : undefined}
	style:object-position={position}
	style:transform={crop && crop.zoom !== 1 ? `scale(${crop.zoom})` : undefined}
	style:transform-origin={position}
	alt=""
	draggable="false"
	loading={lazy ? 'lazy' : undefined}
	{onerror}
	{sizes}
	{src}
	{srcset}
/>

<style>
	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
