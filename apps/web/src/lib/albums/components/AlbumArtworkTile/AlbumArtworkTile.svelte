<script lang="ts">
	import { MetaLine } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import TickTile from '#lib/shared/forms/TickTile/TickTile.svelte';
	import AlbumPicture from '#lib/albums/components/AlbumPicture/AlbumPicture.svelte';
	import { compareWithAlbumHref } from '#lib/albums/album-matching/album-matching.ts';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
	import type { AlbumArtworkState } from '#lib/albums/types/album-artwork-state.ts';

	type Props = {
		slug: string;
		artwork: AlbumArtwork;
		authors: string[];
		date?: string;
		state: AlbumArtworkState;
		checked: boolean;
		ontoggle: () => void;
		compact?: boolean;
	};

	let { slug, artwork, authors, date, state, checked, ontoggle, compact = false }: Props = $props();

	let image = $derived(artwork.images[0]);
	let ratio = $derived(image.width / image.height);
	let authorText = $derived(authors.length > 0 ? authors.join(', ') : m.ui.unknownAuthor);
</script>

{#snippet caption()}
	<cite class="title">{artwork.title}</cite>
	{#if compact}
		<span class="meta authors">{authorText}</span>
		{#if date}
			<span class="meta">{date}</span>
		{/if}
	{:else}
		<MetaLine class="meta" parts={[authorText, date]} />
	{/if}
{/snippet}

{#if state.kind === 'owned'}
	<div class="owned">
		<span style:aspect-ratio={ratio} class="window">
			<span class="picture"><AlbumPicture {image} /></span>
			<span class="badge">{m.albums.inAtelier(formatRecordNumber(state.number))}</span>
		</span>
		<span class="text">
			{@render caption()}
			<a class="action" href={compareWithAlbumHref(state.number, slug, artwork.id)}>
				{m.albums.compare}
			</a>
		</span>
	</div>
{:else}
	<div class="tile">
		<TickTile {checked} {ontoggle} {ratio}>
			{#snippet picture()}
				<AlbumPicture {image} />
			{/snippet}
			{@render caption()}
		</TickTile>
		{#if state.kind === 'similar'}
			<a class="action similar" href={compareWithAlbumHref(state.number, slug, artwork.id)}>
				{m.albums.similar(formatRecordNumber(state.number))}
			</a>
		{/if}
	</div>
{/if}

<style>
	.tile {
		display: grid;
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.owned {
		display: grid;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-2) var(--spacing-3);
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.window {
		position: relative;
		display: block;
		overflow: hidden;
		background: var(--color-mat-window);
	}

	.picture,
	.picture > :global(*) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.window :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.badge {
		position: absolute;
		top: var(--spacing-1);
		right: var(--spacing-1);
		padding: 0 var(--spacing-2);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		font-variant-numeric: tabular-nums;
	}

	.text {
		display: grid;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-style: italic;
		text-wrap: balance;
	}

	.text :global(.meta),
	.tile :global(.meta) {
		color: var(--color-mat-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.authors {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.action {
		color: var(--color-mat-fg);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.similar {
		padding: 0 var(--spacing-2) var(--spacing-3);
	}
</style>
