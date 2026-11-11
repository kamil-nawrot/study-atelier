<script lang="ts">
	import Landmark from '@lucide/svelte/icons/landmark';
	import { Disclosure, NoImage } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

	type Props = {
		exhibitions: readonly ExhibitionSummary[];
		covers: readonly WallArtwork[];
	};

	let { exhibitions, covers }: Props = $props();

	const images = new WallImages();

	let ready = $derived(new Map(images.apply([...covers]).map((artwork) => [artwork.id, artwork])));

	$effect(() => {
		for (const cover of covers) images.request(cover);
	});
</script>

{#if exhibitions.length > 0}
	<Disclosure
		icon={Landmark}
		muted
		open={false}
		title={m.exhibitions.onExhibitions(exhibitions.length)}
	>
		<ul>
			{#each exhibitions as exhibition (exhibition.id)}
				{@const cover = exhibition.coverId ? ready.get(exhibition.coverId) : undefined}
				<li>
					<a class="row" href={resolve('/(app)/atelier/exhibitions/[id]', { id: exhibition.id })}>
						<span class="cover">
							{#if cover?.image?.src}
								<img
									alt=""
									loading="lazy"
									onerror={() => cover && images.failed(cover)}
									src={cover.image.src}
								/>
							{:else}
								<NoImage />
							{/if}
						</span>
						<span class="title">{exhibition.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	</Disclosure>
{/if}

<style>
	ul {
		display: grid;
		gap: var(--spacing-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: grid;
		grid-template-columns: var(--spacing-12) minmax(0, 1fr);
		gap: var(--spacing-3);
		align-items: center;
		color: var(--color-fg);
		text-decoration: none;
	}

	.cover {
		display: grid;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		background: var(--color-mat-bg);
	}

	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
	}
</style>
