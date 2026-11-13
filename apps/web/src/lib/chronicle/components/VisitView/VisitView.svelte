<script lang="ts">
	import { Disclosure, Section, type NoteLinks } from '@study-atelier/ui';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import SmallTicket from '#lib/chronicle/components/SmallTicket/SmallTicket.svelte';
	import VisitTicket from '#lib/chronicle/components/VisitTicket/VisitTicket.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visit: Visit;
		artworks: WallArtwork[];
		tripVisits?: Visit[];
		noteLinks?: NoteLinks;
		glossary?: GlossaryTerm[];
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let {
		visit,
		artworks,
		tripVisits = [],
		noteLinks,
		glossary,
		onnearscreen,
		onimagefailed
	}: Props = $props();

	let texts = $derived(visit.kind === 'trip' ? m.chronicle.trip.view : m.chronicle.view);
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

	{#if tripVisits.length > 0}
		<section aria-labelledby="trip-visits">
			<Disclosure
				count={tripVisits.length}
				id="trip-visits"
				room
				title={m.chronicle.trip.view.visitsTitle}
			>
				<ul class="trip-visits">
					{#each tripVisits as tripVisit (tripVisit.id)}
						<li><SmallTicket visit={tripVisit} /></li>
					{/each}
				</ul>
			</Disclosure>
		</section>
	{/if}

	<section aria-labelledby="visit-seen">
		<Disclosure id="visit-seen" room title={texts.seenTitle}>
			{#if artworks.length > 0}
				<ArtworkWall {artworks} {onimagefailed} {onnearscreen} />
			{:else}
				<p class="caption">{texts.noArtworks}</p>
			{/if}
		</Disclosure>
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

	.trip-visits {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--spacing-4);
		list-style: none;
	}
</style>
