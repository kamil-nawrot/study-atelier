<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { seenArtworks } from '#lib/chronicle/seen/seen.ts';
	import { visitsByYear } from '#lib/chronicle/visit-list/visit-list.ts';
	import VisitTicket from '#lib/chronicle/components/VisitTicket/VisitTicket.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visits: Visit[];
		artworks: ReadonlyMap<string, WallArtwork>;
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { visits, artworks, onnearscreen, onimagefailed }: Props = $props();

	const THUMBNAILS = 3;

	let years = $derived(visitsByYear(visits));
</script>

{#if visits.length === 0}
	<p class="empty">{m.chronicle.empty}</p>
{:else}
	<div class="years">
		{#each years as group (group.year)}
			<section class="year" aria-labelledby="visits-{group.year}">
				<h2 id="visits-{group.year}">{group.year}</h2>
				<ol class="visits">
					{#each group.visits as visit (visit.id)}
						{@const seen = seenArtworks(visit, artworks)}
						<li>
							<VisitTicket
								count={seen.length}
								linked
								more={seen.length - THUMBNAILS}
								{onimagefailed}
								{onnearscreen}
								thumbnails={seen.slice(0, THUMBNAILS)}
								{visit}
							/>
						</li>
					{/each}
				</ol>
			</section>
		{/each}
	</div>
{/if}

<style>
	.years,
	.year,
	.visits {
		display: grid;
		gap: var(--spacing-6);
	}

	.years {
		gap: var(--spacing-12);
	}

	.visits {
		gap: var(--spacing-4);
		padding: 0;
		list-style: none;
	}

	h2 {
		color: var(--color-fg-muted);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.empty {
		max-width: var(--size-content-default);
		color: var(--color-fg-muted);
	}
</style>
