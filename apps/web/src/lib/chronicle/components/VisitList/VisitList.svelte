<script lang="ts">
	import { Disclosure } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { seenArtworks } from '#lib/chronicle/seen/seen.ts';
	import { openYear, visitsByYear } from '#lib/chronicle/visit-list/visit-list.ts';
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
	let opened = $derived(openYear(years));
</script>

{#if visits.length === 0}
	<p class="empty">{m.chronicle.empty}</p>
{:else}
	<div class="years">
		{#each years as group (group.year)}
			<Disclosure
				count={group.visits.length}
				open={group.year === opened}
				title={String(group.year)}
			>
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
			</Disclosure>
		{/each}
	</div>
{/if}

<style>
	.years,
	.visits {
		display: grid;
		gap: var(--spacing-8);
	}

	.visits {
		gap: var(--spacing-4);
		padding: 0;
		list-style: none;
	}

	.empty {
		max-width: var(--size-content-default);
		color: var(--color-fg-muted);
	}
</style>
