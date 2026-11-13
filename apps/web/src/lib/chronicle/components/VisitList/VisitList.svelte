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

{#snippet ticket(visit: Visit, visitCount: number)}
	{@const seen = seenArtworks(visit, artworks)}
	<VisitTicket
		backdrop={visit.kind === 'trip' ? undefined : seen.find((artwork) => artwork.hasImage)}
		count={seen.length}
		linked
		{onimagefailed}
		{onnearscreen}
		{visit}
		{visitCount}
	/>
{/snippet}

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
				count={group.count}
				lazy
				open={group.year === opened}
				room
				title={String(group.year)}
			>
				<ol class="visits">
					{#each group.entries as entry (entry.visit.id)}
						<li class="entry">
							{@render ticket(entry.visit, entry.visits.length)}
							{#if entry.visits.length > 0}
								<div class="indent">
									<ol class="nested">
										{#each entry.visits as visit (visit.id)}
											<li>{@render ticket(visit, 0)}</li>
										{/each}
									</ol>
								</div>
							{/if}
						</li>
					{/each}
				</ol>
			</Disclosure>
		{/each}
	</div>
{/if}

<style>
	.years {
		display: grid;
		gap: var(--spacing-6);
	}

	.years > :global(.room:first-child) {
		padding-top: 0;
		border-top: none;
	}

	.visits {
		display: grid;
		gap: var(--spacing-4);
		list-style: none;
	}

	.entry {
		display: grid;
		gap: var(--spacing-3);
	}

	.indent {
		padding-inline-start: var(--spacing-3);
	}

	.nested {
		display: grid;
		gap: var(--spacing-3);
		padding-inline-start: var(--spacing-3);
		border-inline-start: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	@media (min-width: 768px) {
		.indent {
			padding-inline-start: var(--spacing-8);
		}

		.nested {
			padding-inline-start: var(--spacing-6);
		}
	}
</style>
