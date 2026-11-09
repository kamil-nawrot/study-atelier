<script lang="ts">
	import { ArtworkImage, NoImage, TextButton } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import { formatDate, signedYear } from '#lib/catalogue/years/years.ts';
	import CompareLoupe from '#lib/compare/components/CompareLoupe/CompareLoupe.svelte';
	import type { SharedLoupe } from '#lib/compare/shared-loupe/shared-loupe.svelte.ts';
	import {
		artworkImageSource,
		artworkLargeSource
	} from '#lib/images/artwork-image/artwork-image.ts';
	import PaletteBand from '#lib/images/components/PaletteBand/PaletteBand.svelte';
	import { LOUPE_MIN_RATIO } from '#lib/images/loupe/loupe.ts';
	import type { PaletteLoader } from '#lib/images/palette-loader/palette-loader.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork: ArtworkRecord;
		loupe: SharedLoupe;
		palette: PaletteLoader;
		paletteOn: boolean;
		onready: (ready: boolean) => void;
		changeable: boolean;
		onchange: () => void;
	};

	const STAGE_WIDTH = 960;

	let { artwork, loupe, palette, paletteOn, onready, changeable, onchange }: Props = $props();

	const mouse = new MediaQuery('(hover: hover) and (pointer: fine)');

	let frameWidth = $state(0);
	let image = $derived(artworkImageSource(artwork.image, STAGE_WIDTH));
	let large = $derived(artworkLargeSource(artwork.image));
	let ready = $derived(
		large !== undefined && frameWidth > 0 && large.width >= LOUPE_MIN_RATIO * frameWidth
	);
	let authors = $derived(
		artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor
	);
	let date = $derived(
		formatDate(
			signedYear(artwork.yearFrom, artwork.fromBeforeCommonEra),
			signedYear(artwork.yearTo, artwork.toBeforeCommonEra),
			artwork.yearApproximate
		)
	);
	let alt = $derived(`${artwork.title}, ${authors}`);

	$effect(() => {
		onready(ready);
	});
</script>

<figure class="stage" class:dimmed={image !== undefined}>
	{#if image}
		<img class="backdrop" alt="" aria-hidden="true" src={image.src} />
		<div class="mat">
			<div class="frame" bind:clientWidth={frameWidth}>
				<ArtworkImage
					{alt}
					height={image.height}
					sizes="(min-width: 768px) 50vw, 100vw"
					src={image.src}
					srcset={image.srcset}
					width={image.width}
				/>
				{#if paletteOn && palette.status !== 'unreadable' && palette.status !== 'idle'}
					<PaletteBand collecting={palette.status === 'loading'} colours={palette.colours} />
				{/if}
				{#if loupe.on && ready && mouse.current && large}
					<CompareLoupe image={image.src} large={large.src} {loupe} sourceWidth={large.width} />
				{/if}
			</div>
		</div>
	{:else}
		<span class="mat">
			<span class="window">
				<NoImage />
			</span>
		</span>
	{/if}
	<figcaption class="caption">
		<cite class="artwork-title">{artwork.title}</cite>
		<span class="meta">{date ? `${authors} · ${date}` : authors}</span>
		{#if changeable}
			<span class="change">
				<TextButton onclick={onchange}>
					{m.compare.change}
				</TextButton>
			</span>
		{/if}
	</figcaption>
</figure>

<style>
	.stage {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: center;
		gap: var(--spacing-3);
		min-width: 0;
		padding: var(--spacing-12) var(--spacing-4) var(--spacing-6);
		overflow: hidden;
		background: var(--color-stage-bg);
		color: var(--color-stage-fg-muted);
	}

	.dimmed::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-scrim);
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

	.stage > :not(.backdrop) {
		position: relative;
		z-index: 1;
	}

	.mat {
		display: block;
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.frame {
		position: relative;
	}

	.mat :global(img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 60dvh;
		background: var(--color-mat-window);
	}

	.window {
		display: grid;
		width: min(320px, 100%);
		aspect-ratio: 4 / 5;
	}

	.caption {
		display: grid;
		gap: var(--spacing-1);
		text-align: center;
	}

	.artwork-title {
		color: var(--color-stage-fg);
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
	}

	.meta {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.stage :global(.text-button) {
		color: var(--color-stage-fg);
	}

	@media (min-width: 768px) {
		.mat {
			padding: var(--spacing-4) var(--spacing-4) var(--spacing-6);
		}
	}
</style>
