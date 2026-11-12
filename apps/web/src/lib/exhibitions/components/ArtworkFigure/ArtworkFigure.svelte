<script lang="ts">
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import { MediaQuery } from 'svelte/reactivity';
	import { CappedPicture, NoImage } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import PaletteBand from '#lib/images/components/PaletteBand/PaletteBand.svelte';
	import { PaletteLoader } from '#lib/images/palette-loader/palette-loader.svelte.ts';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

	type Props = {
		lookup: ArtworkLookup;
		artworkId: string;
		flippable?: boolean;
		palette?: boolean;
		paletteOnly?: boolean;
		caption?: string;
		editable?: boolean;
		entries?: readonly GlossaryTerm[];
	};

	let {
		lookup,
		artworkId,
		flippable = false,
		palette = false,
		paletteOnly = false,
		caption = '',
		editable = false,
		entries
	}: Props = $props();

	const artwork = $derived(lookup.get(artworkId));
	const note = $derived(lookup.note(artworkId));
	const canFlip = $derived(flippable && !paletteOnly && lookup.hasNote(artworkId));

	let flipped = $state(false);
	let capped = $state(false);
	const phone = new MediaQuery('max-width: 767.98px');
	const byline = $derived(
		artwork ? [artwork.authors.join(', '), artwork.date].filter(Boolean).join(', ') : ''
	);

	const colours = new PaletteLoader();
	const wantsPalette = $derived(palette || paletteOnly);
	const pictures = $derived(lookup.pictures(artworkId));
	const firstImage = $derived(pictures?.[0] ?? null);
	const collecting = $derived(
		colours.status === 'loading' ||
			(pictures === undefined && colours.status === 'idle' && !lookup.picturesFailed(artworkId))
	);
	const showsPalette = $derived(wantsPalette && (collecting || colours.status === 'ready'));
	const unreadable = $derived(wantsPalette && colours.status === 'unreadable');
	const ratio = $derived(
		artwork?.image?.width && artwork.image.height ? artwork.image.width / artwork.image.height : 0.8
	);

	$effect(() => {
		if (flipped) void lookup.wantNote(artworkId);
	});

	$effect(() => {
		if (!wantsPalette) return;
		void lookup.wantPictures(artworkId);
	});

	$effect(() => {
		if (wantsPalette) void colours.load(firstImage);
	});
</script>

<figure class="figure">
	<div style:--ratio={ratio} class="top">
		<div
			class="mat"
			class:bare={paletteOnly && (showsPalette || unreadable)}
			class:flipped
			class:staged={capped && phone.current}
		>
			{#if paletteOnly && (showsPalette || unreadable)}
				<div class="swatches" data-palette-only="">
					{#if unreadable}
						<p class="unreadable">{m.palette.unreadable}</p>
					{:else}
						<PaletteBand {collecting} colours={colours.colours} inline />
					{/if}
				</div>
			{:else if artwork?.image?.src}
				{@const image = artwork.image}
				{#snippet picture()}
					<img
						alt=""
						draggable="false"
						height={image.height}
						onerror={() => artwork && lookup.imageFailed(artwork)}
						sizes="(min-width: 768px) 1280px, 100vw"
						src={image.src}
						srcset={image.srcset}
						width={image.width}
					/>
				{/snippet}
				{#if phone.current}
					<CappedPicture backdrop={image.src} {ratio} bind:capped>
						{@render picture()}
					</CappedPicture>
				{:else}
					{@render picture()}
				{/if}
			{:else}
				<div class="placeholder">
					<NoImage />
				</div>
			{/if}
			{#if canFlip && flipped}
				<div
					class="back"
					aria-label={m.exhibitions.view.noteOf(artwork?.title ?? '')}
					role="region"
				>
					{#if note?.text}
						<GlossaryNotes {entries} linked links={note.links} value={note.text} />
					{:else if note}
						<p class="empty">{m.exhibitions.view.noNote}</p>
					{:else}
						<p class="empty">{m.exhibitions.view.loadingNote}</p>
					{/if}
				</div>
			{/if}
			{#if canFlip}
				<button
					class="flip"
					aria-label={m.exhibitions.view.flip}
					aria-pressed={flipped}
					onclick={() => (flipped = !flipped)}
					title={m.exhibitions.view.flip}
					type="button"
				>
					<StickyNote aria-hidden="true" size={16} />
				</button>
			{/if}
		</div>
		{#if palette && !paletteOnly && showsPalette}
			<div class="strip" data-palette="">
				<PaletteBand {collecting} colours={colours.colours} inline />
			</div>
		{:else if palette && !paletteOnly && unreadable}
			<p class="unreadable">{m.palette.unreadable}</p>
		{/if}
		{#if artwork}
			<p class="label">
				{#if editable}
					<cite>{artwork.title}</cite>{:else}<a
						href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
						><cite>{artwork.title}</cite></a
					>{/if}{#if byline}, {byline}{/if}
			</p>
		{/if}
	</div>
	{#if caption !== ''}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>

<style>
	.figure {
		display: grid;
		width: 100%;
		gap: var(--spacing-3);
		margin: 0;
		max-width: var(--size-content-wide);
	}

	.top {
		--image-max-height: min(80vh, calc(var(--artwork-max-height, 100000px) - 2 * var(--spacing-4)));
		--image-width: min(100%, calc(var(--image-max-height) * var(--ratio) + 2 * var(--spacing-4)));

		display: grid;
		gap: var(--spacing-2);
		justify-items: var(--block-justify, start);
	}

	.mat {
		position: relative;
		display: grid;
		place-items: center;
		max-width: 100%;
		padding: var(--spacing-4);
		background: var(--color-mat-bg);
		cursor: default;
	}

	.mat img {
		display: block;
		width: auto;
		max-width: 100%;
		max-height: var(--image-max-height);
		height: auto;
	}

	.placeholder {
		width: calc(20 * var(--spacing-6));
		max-width: 100%;
	}

	.mat:has(> :global(.capped-picture)) {
		width: 100%;
	}

	.mat.bare,
	.mat.staged {
		width: 100%;
		padding: 0;
		background: none;
	}

	.swatches {
		width: 100%;
	}

	.unreadable {
		margin: 0;
		padding: var(--spacing-3);
		background: var(--color-palette-band);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}

	.strip {
		width: var(--image-width);
	}

	.label {
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.label cite {
		color: var(--color-fg);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
	}

	.label a {
		color: inherit;
		text-decoration: none;
	}

	figcaption {
		max-width: var(--size-content-default);
		line-height: var(--line-height-md);
	}

	.mat.flipped > :not(.back, .flip),
	.mat.flipped > :global(.capped-picture) {
		visibility: hidden;
	}

	.back {
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		padding: calc(var(--spacing-6) + var(--spacing-8)) var(--spacing-4) var(--spacing-4);
		overflow-y: auto;
		background: var(--color-surface);
		color: var(--color-fg);
		text-align: start;
	}

	.empty {
		margin: 0;
		color: var(--color-fg-muted);
	}

	.flip {
		position: absolute;
		top: var(--spacing-6);
		right: var(--spacing-6);
		display: grid;
		place-items: center;
		width: var(--spacing-8);
		height: var(--spacing-8);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-stage-fg);
		cursor: pointer;
		isolation: isolate;
		opacity: 0.7;
	}

	.flip::before {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: color-mix(in srgb, var(--color-stage-bg) 60%, transparent);
		clip-path: circle(50%);
		content: '';
	}

	.flip:hover,
	.flip:focus-visible,
	.flip[aria-pressed='true'] {
		opacity: 1;
	}

	@media (max-width: 767.98px) {
		.top {
			--picture-max-height: calc(var(--image-max-height) + 2 * var(--spacing-2));
		}
	}
</style>
