<script lang="ts">
	import { NoImage } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { pinCropRect } from '#lib/pins/pin-crop-rect/pin-crop-rect.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';

	type Props = {
		lookup: ArtworkLookup;
		artworkId: string;
		imageId?: string | null;
		x: number;
		y: number;
		viewWidth: number;
		editable?: boolean;
		selected?: boolean;
		onselect?: () => void;
	};

	const SOURCE_WIDTH = 1280;

	let {
		lookup,
		artworkId,
		imageId = null,
		x,
		y,
		viewWidth,
		editable = false,
		selected = false,
		onselect
	}: Props = $props();

	const artwork = $derived(lookup.get(artworkId));
	const image = $derived.by(() => {
		const pictures = lookup.pictures(artworkId) ?? [];
		return pictures.find((picture) => picture.id === imageId) ?? pictures[0] ?? null;
	});
	const source = $derived(artworkImageSource(image, SOURCE_WIDTH));
	const rect = $derived(
		image?.width && image.height
			? pinCropRect({ x, y, viewWidth }, image.width, image.height)
			: undefined
	);
	const position = $derived.by(() => {
		if (!rect || !image?.width || !image.height) return undefined;
		const free = (extent: number): number => (extent > rect.side ? extent - rect.side : 1);
		return {
			size: `${(image.width / rect.side) * 100}% auto`,
			place: `${(rect.left / free(image.width)) * 100}% ${(rect.top / free(image.height)) * 100}%`
		};
	});

	$effect(() => {
		void lookup.wantPictures(artworkId);
	});
</script>

<figure class="figure" class:selected>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="crop" onclick={onselect}>
		{#if source && position}
			<div
				style:background-image={`url(${JSON.stringify(source.src)})`}
				style:background-position={position.place}
				style:background-size={position.size}
				class="fragment"
				aria-label={artwork ? m.exhibitions.closeUp.label(artwork.title) : ''}
				data-fragment=""
				role="img"
			></div>
		{:else if source}
			<img
				style:object-position="{x * 100}% {y * 100}%"
				alt=""
				draggable="false"
				src={source.src}
			/>
		{:else}
			<div class="placeholder">
				<NoImage />
			</div>
		{/if}
	</div>
	{#if artwork}
		<figcaption>
			{#if editable}
				{m.exhibitions.closeUp.caption}<cite>{artwork.title}</cite>
			{:else}
				{m.exhibitions.closeUp.caption}<a
					href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
					><cite>{artwork.title}</cite></a
				>
			{/if}
		</figcaption>
	{/if}
</figure>

<style>
	.figure {
		display: grid;
		gap: var(--spacing-2);
		justify-items: start;
		margin: 0;
	}

	.figure.selected .crop {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.crop {
		width: 100%;
		max-width: calc(20 * var(--spacing-6));
		aspect-ratio: 1;
		background: var(--color-mat-bg);
		cursor: default;
	}

	.fragment,
	.crop img {
		width: 100%;
		height: 100%;
		background-repeat: no-repeat;
	}

	.crop img {
		display: block;
		object-fit: cover;
	}

	.placeholder {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}

	figcaption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	cite {
		color: var(--color-fg);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
	}

	a {
		color: inherit;
		text-decoration: none;
	}
</style>
