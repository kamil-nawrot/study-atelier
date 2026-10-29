<script lang="ts">
	import Footprints from '@lucide/svelte/icons/footprints';
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, Disclosure, EmptyState, Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
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

	let years = $derived(visitsByYear(visits));
	let opened = $derived(openYear(years));
</script>

{#if visits.length === 0}
	<EmptyState icon={Footprints} text={m.chronicle.empty} title={m.chronicle.emptyTitle}>
		<Button href={resolve('/(app)/atelier/chronicle/new')}>
			<Icon icon={Plus} />
			{m.chronicle.addFirst}
		</Button>
	</EmptyState>
{:else}
	<div class="years">
		{#each years as group (group.year)}
			<Disclosure
				count={group.visits.length}
				lazy
				open={group.year === opened}
				title={String(group.year)}
			>
				<ol class="visits">
					{#each group.visits as visit (visit.id)}
						{@const seen = seenArtworks(visit, artworks)}
						<li>
							<VisitTicket
								backdrop={seen.find((artwork) => artwork.hasImage)}
								count={seen.length}
								linked
								{onimagefailed}
								{onnearscreen}
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

	@media (min-width: 768px) {
		.visits {
			max-width: max(50%, var(--size-content-narrow));
		}
	}
</style>
