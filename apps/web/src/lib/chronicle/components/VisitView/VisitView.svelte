<script lang="ts">
	import { Section, type NoteLinks } from '@study-atelier/ui';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import VisitTicket from '#lib/chronicle/components/VisitTicket/VisitTicket.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visit: Visit;
		artworks: WallArtwork[];
		noteLinks?: NoteLinks;
		glossary?: GlossaryEntry[];
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { visit, artworks, noteLinks, glossary, onnearscreen, onimagefailed }: Props = $props();
</script>

<article class="visit">
	<VisitTicket count={artworks.length} {visit} />

	{#if visit.notes}
		<div class="notes">
			<Section aria-label={m.common.notes}>
				<GlossaryNotes entries={glossary} links={noteLinks} value={visit.notes} />
			</Section>
		</div>
	{/if}

	<section class="seen" aria-labelledby="visit-seen">
		<h2 id="visit-seen">{m.chronicle.view.seenTitle}</h2>
		{#if artworks.length > 0}
			<ArtworkWall {artworks} {onimagefailed} {onnearscreen} />
		{:else}
			<p class="caption">{m.chronicle.view.noArtworks}</p>
		{/if}
	</section>
</article>

<style>
	.visit {
		display: grid;
		gap: var(--spacing-8);
	}

	.notes {
		max-width: var(--size-content-default);
	}

	.seen {
		display: grid;
		gap: var(--spacing-6);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}
</style>
