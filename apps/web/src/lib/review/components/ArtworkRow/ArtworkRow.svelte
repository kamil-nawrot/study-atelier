<script lang="ts">
	import { resolve } from '$app/paths';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { authorsOf } from '#lib/review/overview/overview.ts';

	type Props = {
		artwork: WallArtwork;
		detail?: string;
	};

	let { artwork, detail }: Props = $props();
</script>

<a
	class="row"
	class:detailed={detail !== undefined}
	href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
>
	<span class="thumbnail">
		{#if artwork.image?.src}
			<img
				alt=""
				loading="lazy"
				sizes="64px"
				src={artwork.image.src}
				srcset={artwork.image.srcset}
			/>
		{/if}
	</span>
	<span class="text">
		<cite class="artwork-title">{artwork.title}</cite>
		<span class="caption">{authorsOf(artwork)}</span>
	</span>
	{#if detail}
		<span class="caption detail">{detail}</span>
	{/if}
</a>

<style>
	.row {
		display: grid;
		grid-template-columns: var(--spacing-16) minmax(0, 1fr);
		gap: var(--spacing-3);
		align-items: center;
		color: inherit;
		text-decoration: none;
	}

	.detailed {
		grid-template-columns: var(--spacing-16) minmax(0, 1fr) auto;
	}

	.thumbnail {
		display: block;
		aspect-ratio: 1;
		padding: var(--spacing-1);
		overflow: hidden;
		background: var(--color-mat-bg);
	}

	.thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.text {
		display: grid;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.text > * {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.detail {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.row:hover .artwork-title {
		text-decoration: underline;
	}
</style>
