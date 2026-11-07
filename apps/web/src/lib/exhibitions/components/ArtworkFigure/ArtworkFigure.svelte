<script lang="ts">
	import { NoImage } from '@study-atelier/ui';
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
		showNote?: boolean;
		palette?: boolean;
		paletteOnly?: boolean;
		caption?: string;
		editable?: boolean;
		empty?: boolean;
		selected?: boolean;
		entries?: readonly GlossaryTerm[];
		onselect?: () => void;
	};

	let {
		lookup,
		artworkId,
		showNote = false,
		palette = false,
		paletteOnly = false,
		caption,
		editable = false,
		empty = false,
		selected = false,
		entries,
		onselect
	}: Props = $props();

	const artwork = $derived(lookup.get(artworkId));
	const note = $derived(lookup.note(artworkId));
	const byline = $derived(
		artwork ? [artwork.authors.join(', '), artwork.date].filter(Boolean).join(', ') : ''
	);

	const colours = new PaletteLoader();
	const wantsPalette = $derived(palette || paletteOnly);
	const pictures = $derived(lookup.pictures(artworkId));
	const firstImage = $derived(pictures?.[0] ?? null);
	const collecting = $derived(
		colours.status === 'loading' || (pictures === undefined && colours.status === 'idle')
	);
	const showsPalette = $derived(wantsPalette && (collecting || colours.status === 'ready'));
	const unreadable = $derived(wantsPalette && colours.status === 'unreadable');
	const ratio = $derived(
		artwork?.image?.width && artwork.image.height ? artwork.image.width / artwork.image.height : 0.8
	);

	$effect(() => {
		if (showNote) void lookup.wantNote(artworkId);
	});

	$effect(() => {
		if (!wantsPalette) return;
		void lookup.wantPictures(artworkId);
	});

	$effect(() => {
		if (wantsPalette) void colours.load(firstImage);
	});
</script>

<figure class="figure" class:selected>
	<div style:--ratio={ratio} class="top" contenteditable="false">
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="mat" class:bare={paletteOnly && (showsPalette || unreadable)} onclick={onselect}>
			{#if paletteOnly && (showsPalette || unreadable)}
				<div class="swatches" data-palette-only="">
					{#if unreadable}
						<p class="unreadable">{m.palette.unreadable}</p>
					{:else}
						<PaletteBand {collecting} colours={colours.colours} inline />
					{/if}
				</div>
			{:else if artwork?.image?.src}
				<img
					alt=""
					draggable="false"
					height={artwork.image.height}
					onerror={() => artwork && lookup.imageFailed(artwork)}
					sizes="(min-width: 768px) 1280px, 100vw"
					src={artwork.image.src}
					srcset={artwork.image.srcset}
					width={artwork.image.width}
				/>
			{:else}
				<div class="placeholder">
					<NoImage />
				</div>
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
	{#if caption === undefined}
		<figcaption
			class:empty
			data-caption=""
			data-placeholder={editable ? m.exhibitions.view.captionHint : undefined}
		></figcaption>
	{:else if caption !== ''}
		<figcaption>{caption}</figcaption>
	{/if}
	{#if showNote && artwork}
		<aside class="note" contenteditable="false">
			<p class="note-label">{m.exhibitions.bar.noteOf(artwork.title)}</p>
			{#if note?.text}
				<GlossaryNotes {entries} linked={!editable} links={note.links} value={note.text} />
			{:else if note}
				<p class="caption">{m.exhibitions.bar.noNote}</p>
			{/if}
		</aside>
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

	.figure.selected .mat {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.top {
		--image-width: min(100%, calc(80vh * var(--ratio) + 2 * var(--spacing-4)));

		display: grid;
		gap: var(--spacing-2);
		justify-items: start;
	}

	.mat {
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
		max-height: 80vh;
		height: auto;
	}

	.placeholder {
		width: calc(20 * var(--spacing-6));
		max-width: 100%;
	}

	.mat.bare {
		width: var(--image-width);
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
		min-height: calc(1em * var(--line-height-md));
		line-height: var(--line-height-md);
	}

	figcaption.empty::before {
		content: attr(data-placeholder);
		position: absolute;
		color: var(--color-fg-muted);
		pointer-events: none;
	}

	.note {
		display: grid;
		gap: var(--spacing-2);
		max-width: var(--size-content-default);
		padding: var(--spacing-3) var(--spacing-4);
		border-left: var(--border-width-base) solid var(--color-line);
		background: var(--color-surface);
	}

	.note-label {
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
