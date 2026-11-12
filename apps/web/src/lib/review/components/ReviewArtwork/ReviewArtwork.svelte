<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ArtworkImage, ImageCredit, NoImage } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import ImageViewer from '#lib/images/components/ImageViewer/ImageViewer.svelte';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork?: WallArtwork;
		image?: { src?: string; srcset?: string; width?: number; height?: number };
		alt: string;
		credit?: string;
		compact?: boolean;
		collapsed?: boolean;
		overlay?: Snippet;
	};

	let {
		artwork,
		image,
		alt,
		credit,
		compact = false,
		collapsed = false,
		overlay
	}: Props = $props();

	let viewer = $state<ReturnType<typeof ImageViewer>>();
</script>

<figure class="artwork" class:collapsed class:compact class:dimmed={image?.src !== undefined}>
	{#if image?.src}
		<img class="backdrop" alt="" aria-hidden="true" src={image.src} />
		<button
			class="open"
			aria-label={m.artworkView.openImage}
			onclick={() => viewer?.open()}
			type="button"
		>
			<span class="mat">
				<span class="frame">
					<ArtworkImage
						{alt}
						height={image.height}
						loading="eager"
						sizes="(min-width: 768px) 60vw, 100vw"
						src={image.src}
						srcset={image.srcset}
						width={image.width}
					/>
					{@render overlay?.()}
				</span>
			</span>
		</button>
	{:else if artwork?.imageUnavailable}
		<span class="mat">
			<ArtworkImage {alt} unavailable />
		</span>
	{:else}
		<span class="mat">
			<span class="window">
				<NoImage />
			</span>
		</span>
	{/if}
</figure>
{#if credit}
	<ImageCredit label={m.artwork.creditLabel} text={credit} />
{/if}

{#if image?.src}
	<ImageViewer bind:this={viewer} {alt} {image} />
{/if}

<style>
	.artwork {
		display: grid;
		justify-items: center;
		gap: var(--spacing-3);
		margin: 0;
	}

	.dimmed::after {
		content: '';
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--color-stage-bg) 70%, transparent);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(32px);
		scale: 1.2;
	}

	.artwork > :not(.backdrop) {
		position: relative;
		z-index: 1;
	}

	.open {
		display: block;
		max-width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: var(--cursor-zoom-in);
	}

	.mat {
		display: block;
		max-width: 100%;
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.frame {
		position: relative;
		display: block;
	}

	.mat :global(img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 50dvh;
		background: var(--color-mat-window);
	}

	.window {
		display: grid;
		width: min(320px, calc(100vw - 2 * var(--spacing-6)));
		aspect-ratio: 4 / 5;
	}

	@media (max-width: 767.98px) {
		.compact .mat :global(img) {
			max-height: 30svh;
		}

		.collapsed .mat {
			padding: var(--spacing-1);
		}

		.compact.collapsed .mat :global(img) {
			max-height: var(--spacing-24);
		}
	}

	@media (min-width: 768px) {
		.mat {
			padding: var(--spacing-4) var(--spacing-4) var(--spacing-6);
		}

		.mat :global(img) {
			max-width: calc(100cqw - 2 * var(--spacing-4));
			max-height: calc(100cqh - var(--spacing-12) - var(--spacing-8));
		}

		.window {
			width: auto;
			height: calc(100cqh - var(--spacing-24) - var(--spacing-12));
		}
	}
</style>
