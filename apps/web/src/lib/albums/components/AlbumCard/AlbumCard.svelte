<script lang="ts">
	import { MetaLine } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AlbumPicture from '#lib/albums/components/AlbumPicture/AlbumPicture.svelte';
	import {
		albumCounts,
		coverImages,
		COVER_IMAGES
	} from '#lib/albums/album-summary/album-summary.ts';
	import type { ListedAlbum } from '#lib/albums/types/listed-album.ts';

	type Props = {
		listed: ListedAlbum;
	};

	let { listed }: Props = $props();

	const CELL_SIZES = '160px';

	let album = $derived(listed.album);
	let counts = $derived(albumCounts(album));
	let cover = $derived(coverImages(album));
	let blanks = $derived(Math.max(0, COVER_IMAGES - cover.length));
</script>

<li class="card">
	<a class="link" href={resolve('/(app)/atelier/albums/[slug]', { slug: album.slug })}>
		<span class="mosaic" aria-hidden="true">
			{#each cover as image (image.path)}
				<span class="cell"><AlbumPicture {image} sizes={CELL_SIZES} /></span>
			{/each}
			{#each { length: blanks }, index (index)}
				<span class="cell"></span>
			{/each}
		</span>
		<span class="title">{album.title}</span>
	</a>
	<MetaLine class="caption" text={m.albums.counts(counts.artworks, counts.terms, counts.events)} />
	{#if listed.owned > 0}
		<p class="caption">{m.albums.owned(listed.owned, counts.artworks)}</p>
	{/if}
</li>

<style>
	.card {
		display: grid;
		align-content: start;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.link {
		display: grid;
		gap: var(--spacing-3);
		padding-block-end: var(--spacing-1);
		color: var(--color-fg);
		text-decoration: none;
	}

	.mosaic {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--border-width-base);
		aspect-ratio: 1;
	}

	.cell {
		display: block;
		overflow: hidden;
		aspect-ratio: 1;
		background: var(--color-mat-window);
	}

	.cell > :global(*) {
		width: 100%;
		height: 100%;
	}

	.cell :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		font-style: italic;
		line-height: var(--line-height-lg);
		text-wrap: balance;
	}

	.link:hover .title {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}
</style>
