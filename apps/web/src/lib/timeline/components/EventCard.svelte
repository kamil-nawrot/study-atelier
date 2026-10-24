<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, Icon, TextButton } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { WIKIPEDIA_LICENCE_URL } from '#lib/glossary/wikipedia.ts';
	import { m } from '#lib/i18n/index.ts';
	import { yearsLong } from '../event-lanes.ts';
	import type { TimelineEvent } from '../types.ts';

	type Props = {
		event: TimelineEvent;
		artworks: readonly WallArtwork[];
		onartwork: (artwork: WallArtwork) => void;
		onwhole: () => void;
		ondelete: () => void;
	};

	let { event, artworks, onartwork, onwhole, ondelete }: Props = $props();

	const SHOWN_ARTWORKS = 10;

	let period = $derived(event.yearFrom !== null);
	let length = $derived(yearsLong(event));
	let date = $derived(formatDate(event.yearFrom, event.yearTo, event.yearApproximate));
</script>

<section class="card" aria-label={period ? m.timeline.card.period : m.timeline.card.event}>
	<div class="head">
		<div class="title">
			<span class="kind caption">{period ? m.timeline.card.period : m.timeline.card.event}</span>
			<h2>{event.name}</h2>
			<p>
				{date}{#if period && length > 0}<span class="muted"
						>{` · ${m.timeline.card.length(length)}`}</span
					>{/if}
			</p>
		</div>
		<div class="actions">
			<Button href={resolve('/(app)/atelier/timeline/events/[id]/edit', { id: event.id })}>
				<Icon icon={Pencil} size="sm" />
				{m.timeline.card.edit}
			</Button>
			<Button onclick={ondelete} variant="danger">
				<Icon icon={Trash} size="sm" />
				{m.timeline.card.delete}
			</Button>
		</div>
	</div>
	{#if event.description}
		<p>{event.description}</p>
	{/if}
	{#if event.source}
		<p class="caption">
			{m.timeline.card.sourcePrefix}<a
				href={event.source.url}
				rel="external noreferrer"
				target="_blank">„{event.source.title}”</a
			>,
			<a href={WIKIPEDIA_LICENCE_URL} rel="external noreferrer" target="_blank"
				>{event.source.licence}</a
			>
		</p>
	{/if}
	{#if period}
		<div>
			<TextButton inline onclick={onwhole}>{m.timeline.card.showWhole}</TextButton>
		</div>
	{/if}
	<div class="artworks">
		<span class="caption">{m.timeline.card.artworksOfTime}</span>
		{#if artworks.length === 0}
			<p class="caption">{m.timeline.card.noArtworks}</p>
		{:else}
			<ul>
				{#each artworks.slice(0, SHOWN_ARTWORKS) as artwork (artwork.id)}
					<li>
						<button class="artwork" onclick={() => onartwork(artwork)} type="button">
							<cite class="artwork-title">{artwork.title}</cite>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.card {
		display: grid;
		gap: var(--spacing-3);
		padding: var(--spacing-4);
		background: var(--color-surface);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-3);
	}

	.title {
		display: grid;
		gap: var(--spacing-1);
	}

	.kind {
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.muted {
		color: var(--color-fg-muted);
	}

	.actions {
		display: flex;
		gap: var(--spacing-2);
	}

	.artworks {
		display: grid;
		gap: var(--spacing-2);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-4);
		padding: 0;
		list-style: none;
	}

	.artwork {
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-fg);
		cursor: pointer;
	}

	.artwork:hover cite {
		text-decoration: underline;
	}
</style>
