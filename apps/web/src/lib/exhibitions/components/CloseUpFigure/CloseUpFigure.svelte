<script lang="ts">
	import { NoImage } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import PinView from '#lib/pins/components/PinView/PinView.svelte';
	import { LOUPE_SIZE } from '#lib/images/loupe/loupe.ts';
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
	const pictures = $derived(lookup.pictures(artworkId));
	const image = $derived(
		pictures?.find((picture) => picture.id === imageId) ?? pictures?.[0] ?? null
	);

	$effect(() => {
		void lookup.wantPictures(artworkId);
	});
</script>

<figure class="figure" class:selected>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		style:max-width="{LOUPE_SIZE}px"
		class="crop"
		aria-label={artwork ? m.exhibitions.closeUp.label(artwork.title) : undefined}
		data-fragment=""
		onclick={onselect}
		role="img"
	>
		{#if image}
			<PinView {image} {viewWidth} {x} {y} />
		{:else if pictures}
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
		cursor: default;
	}

	.placeholder {
		aspect-ratio: 1;
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
