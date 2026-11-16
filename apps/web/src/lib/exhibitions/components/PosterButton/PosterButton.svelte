<script lang="ts">
	import Crop from '@lucide/svelte/icons/crop';
	import { Button, Toast, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import PosterDialog from '#lib/exhibitions/components/PosterDialog/PosterDialog.svelte';
	import { artworkIdsOf } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
	import type { ExhibitionPoster } from '#lib/exhibitions/types/exhibition-poster.ts';

	type Props = {
		exhibitionId: string;
		document: ExhibitionDocument;
		lookup: ArtworkLookup;
		poster: ExhibitionPoster;
	};

	let { exhibitionId, document, lookup, poster }: Props = $props();

	let open = $state(false);
	let saved = $state.raw<ExhibitionPoster>();
	let toast = $state<Toast>();

	let artworkIds = $derived(artworkIdsOf(document).filter((id) => lookup.get(id) !== undefined));

	function stored(next: ExhibitionPoster): void {
		saved = next;
		toast?.show(m.exhibitions.poster.saved);
	}
</script>

{#if artworkIds.length > 0}
	<Button aria-label={m.exhibitions.poster.open} compact icon={Crop} onclick={() => (open = true)}>
		{m.exhibitions.poster.open}
	</Button>
{:else}
	<Tooltip align="end" placement="bottom" text={m.exhibitions.poster.noArtworks}>
		{#snippet children(describedby)}
			<Button
				aria-describedby={describedby}
				aria-disabled="true"
				aria-label={m.exhibitions.poster.open}
				compact
				icon={Crop}
			>
				{m.exhibitions.poster.open}
			</Button>
		{/snippet}
	</Tooltip>
{/if}

<PosterDialog
	{artworkIds}
	{exhibitionId}
	{lookup}
	onsaved={stored}
	stored={saved ?? poster}
	bind:open
/>

<Toast bind:this={toast} />
