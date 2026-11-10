<script lang="ts">
	import { MetaLine, Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { m } from '#lib/i18n/i18n.ts';
	import RelationsBand from '#lib/relations/components/RelationsBand/RelationsBand.svelte';
	import type { Relations } from '#lib/relations/types/relations.ts';
	import ArtworksSection from '#lib/wall/components/ArtworksSection/ArtworksSection.svelte';
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
		relations?: Relations;
	};

	let { field, value, artworks: loaded, relations }: Props = $props();

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
			<MetaLine
				parts={[m.ownFields.page.valueKind(field.name), m.atelier.count(artworks.length)]}
			/>
		</p>
		<h1>{value.name}</h1>
	</header>

	{#if relations}
		<RelationsBand {relations} />
	{/if}

	<ArtworksSection
		{artworks}
		empty={m.ownFields.page.noArtworks}
		{images}
		title={m.ownFields.page.artworks}
	/>
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
</style>
