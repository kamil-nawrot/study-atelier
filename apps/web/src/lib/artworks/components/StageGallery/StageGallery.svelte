<script lang="ts">
	import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		gallery: ArtworkImageInput[];
		shown: number;
	};

	let { gallery, shown = $bindable() }: Props = $props();

	const GALLERY_WIDTH = 120;
</script>

<div class="gallery">
	{#each gallery as item, index (index)}
		{@const thumb = artworkImageSource(item, GALLERY_WIDTH)}
		<button
			class="thumb"
			class:shown={index === shown}
			aria-label={m.artworkForm.imageSlot(index + 1, gallery.length)}
			aria-pressed={index === shown}
			onclick={() => (shown = index)}
			type="button"
		>
			{#if thumb}
				<img alt="" src={thumb.src} />
			{/if}
		</button>
	{/each}
</div>

<style>
	.gallery {
		position: absolute;
		right: 0;
		bottom: var(--spacing-6);
		left: 0;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--spacing-2);
	}

	.thumb {
		width: var(--size-gallery-thumb);
		height: var(--size-gallery-thumb);
		padding: 0;
		overflow: hidden;
		border: var(--border-width-base) solid var(--color-stage-fg-muted);
		background: transparent;
		cursor: pointer;
		opacity: 0.6;
	}

	.thumb.shown {
		border-color: var(--color-stage-fg);
		opacity: 1;
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
