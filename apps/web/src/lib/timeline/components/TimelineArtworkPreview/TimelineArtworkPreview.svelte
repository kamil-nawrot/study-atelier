<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { ArtworkTile, Icon } from '@study-atelier/ui';
	import { eraIcon, eraName } from '#lib/catalogue/eras/eras.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork: WallArtwork;
		date?: string;
		style: string;
		imageHeight: number;
		height?: number;
		onkeep: () => void;
		onleave: () => void;
	};

	let {
		artwork,
		date,
		style,
		imageHeight,
		height = $bindable(0),
		onkeep,
		onleave
	}: Props = $props();

	let href = $derived(resolve('/(app)/atelier/[number]', { number: String(artwork.number) }));
</script>

<div
	{style}
	style:--artwork-max-height="{imageHeight}px"
	class="preview"
	aria-label={artwork.title}
	onfocusin={onkeep}
	onfocusout={onleave}
	onpointerenter={onkeep}
	onpointerleave={onleave}
	role="group"
	bind:clientHeight={height}
>
	<ArtworkTile
		authors={artwork.authors}
		{date}
		favourite={artwork.favourite}
		favouriteLabel={artwork.favourite ? m.favourite.remove : m.favourite.add}
		{href}
		image={artwork.image}
		imageUnavailable={artwork.imageUnavailable}
		mark={artwork.eraCode ? eraIcon(artwork.eraCode) : undefined}
		markLabel={artwork.eraCode ? eraName(artwork.eraCode) : undefined}
		number={artwork.number}
		title={artwork.title}
	/>
	<a class="open" {href}>
		{m.timeline.openInAtelier}
		<Icon icon={ArrowRight} size="sm" />
	</a>
</div>

<style>
	.preview {
		position: absolute;
		z-index: 5;
		display: grid;
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.open {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-3);
		border-top: var(--border-width-base) solid var(--color-mat-window);
		color: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-decoration: none;
	}

	.open:hover {
		text-decoration: underline;
	}

	@media (prefers-reduced-motion: no-preference) {
		.preview {
			animation: preview-enter var(--duration-short) ease-out;
		}
	}

	@keyframes preview-enter {
		from {
			opacity: 0;
		}
	}
</style>
