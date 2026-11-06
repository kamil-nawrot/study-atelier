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
	};

	let { title, empty, artworks, images }: Props = $props();
</script>

<section class="artworks" aria-label={title}>
	<Disclosure count={artworks.length} {title}>
		{#if artworks.length === 0}
			<p class="empty">{empty}</p>
		{:else}
			<ArtworkWall
				{artworks}
				onimagefailed={(artwork) => images.failed(artwork)}
				onnearscreen={(artwork) => images.request(artwork)}
			/>
		{/if}
	</Disclosure>
</section>

<style>
	.artworks {
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
