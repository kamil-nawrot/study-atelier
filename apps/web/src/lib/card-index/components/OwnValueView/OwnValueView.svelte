<script lang="ts">
	import { Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import OwnValueDialog from '#lib/card-index/components/OwnValueDialog/OwnValueDialog.svelte';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import { ownValuePath } from '#lib/card-index/own-field-pages/own-field-pages.ts';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';
	import type { OwnValue } from '#lib/card-index/types/own-value.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		field: OwnField;
		value: OwnValue;
		artworks: WallArtwork[];
	};

	let { field, value, artworks: loaded }: Props = $props();

	const images = new WallImages();

	let toast: Toast;
	let editOpen = $state(false);

	let artworks = $derived(images.apply(loaded));

	$effect.pre(() => {
		void loaded;
		images.reset();
	});

	export function edit(): void {
		editOpen = true;
	}

	async function saved(message: string, kept?: OwnValue): Promise<void> {
		if (kept) await goto(ownValuePath(field.id, kept.id), { replace: true });
		else await invalidateAll();
		toast.show(message);
	}
</script>

<div class="page">
	<header>
		<p class="kind">
			{m.ownFields.summary([
				m.ownFields.page.valueKind(field.name),
				m.atelier.count(artworks.length)
			])}
		</p>
		<h1>{value.name}</h1>
	</header>

	<section class="artworks" aria-labelledby="value-artworks">
		<header>
			<h2 id="value-artworks">{m.ownFields.page.artworks}</h2>
			<span class="count">{m.atelier.count(artworks.length)}</span>
		</header>
		{#if artworks.length === 0}
			<p class="empty">{m.ownFields.page.noArtworks}</p>
		{:else}
			<ArtworkWall
				{artworks}
				onimagefailed={(artwork) => images.failed(artwork)}
				onnearscreen={(artwork) => images.request(artwork)}
			/>
		{/if}
	</section>
</div>

<Toast bind:this={toast} />

<OwnValueDialog {field} onsaved={saved} {value} bind:open={editOpen} />

<style>
	.page {
		display: grid;
		gap: var(--spacing-8);
	}

	header {
		display: grid;
		gap: var(--spacing-2);
	}

	.kind {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	.artworks {
		display: grid;
		gap: var(--spacing-6);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.artworks header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	h2 {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
	}

	.count,
	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
