<script lang="ts">
	import { Disclosure } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';

	type Props = {
		title: string;
		empty: string;
		artworks: WallArtwork[];
		images: WallImages;
		hrefOf?: (artwork: WallArtwork) => string;
	};

	let { title, empty, artworks, images, hrefOf }: Props = $props();
</script>

<section aria-label={title}>
	<Disclosure count={artworks.length} room {title}>
		{#if artworks.length === 0}
			<p class="empty">{empty}</p>
		{:else}
			<ArtworkWall
				{artworks}
				{hrefOf}
				onimagefailed={(artwork) => images.failed(artwork)}
				onnearscreen={(artwork) => images.request(artwork)}
			/>
		{/if}
	</Disclosure>
</section>

<style>
	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
