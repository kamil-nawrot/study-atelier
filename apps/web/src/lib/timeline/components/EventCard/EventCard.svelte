<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, Icon, MetaLine, TextButton, Tooltip } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { WIKIPEDIA_LICENCE_URL } from '#lib/glossary/wikipedia/wikipedia.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { yearsLong } from '#lib/timeline/event-lanes/event-lanes.ts';
	import { eventPath } from '#lib/timeline/event-page/event-page.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

	type Props = {
		event: TimelineEvent;
		artworks: readonly WallArtwork[];
		onartwork: (artwork: WallArtwork) => void;
		onwhole: () => void;
		ondelete: () => void;
		compact?: boolean;
		headingId?: string;
		onleave?: () => void;
	};

	let {
		event,
		artworks,
		onartwork,
		onwhole,
		ondelete,
		compact = false,
		headingId,
		onleave
	}: Props = $props();

	const SHOWN_ARTWORKS = 10;

	let period = $derived(event.yearFrom !== null);
	let length = $derived(yearsLong(event));
	let date = $derived(formatDate(event.yearFrom, event.yearTo, event.yearApproximate));
	let editPath = $derived(resolve('/(app)/atelier/timeline/events/[id]/edit', { id: event.id }));
</script>

{#snippet lengthPart()}
	<span class="muted">{m.timeline.card.length(length)}</span>
{/snippet}

{#snippet iconActions()}
	<Tooltip align="end" placement="bottom" text={m.common.edit}>
		{#snippet children(id)}
			<Button aria-describedby={id} aria-label={m.common.edit} href={editPath} onclick={onleave}>
				<Icon icon={Pencil} size="sm" />
			</Button>
		{/snippet}
	</Tooltip>
	<Tooltip align="end" placement="bottom" text={m.common.delete}>
		{#snippet children(id)}
			<Button
				aria-describedby={id}
				aria-label={m.common.delete}
				onclick={ondelete}
				variant="danger"
			>
				<Icon icon={Trash} size="sm" />
			</Button>
		{/snippet}
	</Tooltip>
{/snippet}

<section
	class="card"
	class:compact
	aria-label={compact ? undefined : period ? m.timeline.card.period : m.timeline.card.event}
>
	<div class="head">
		<div class="title">
			<span class="kind caption">{period ? m.timeline.card.period : m.timeline.card.event}</span>
			<h2 id={headingId}><a href={eventPath(event.id)} onclick={onleave}>{event.name}</a></h2>
			<p>
				<MetaLine parts={[date, period && length > 0 && lengthPart]} />
			</p>
		</div>
		<div class="actions">
			{#if compact}
				{@render iconActions()}
			{:else}
				<Button href={editPath}>
					<Icon icon={Pencil} size="sm" />
					{m.common.edit}
				</Button>
				<Button onclick={ondelete} variant="danger">
					<Icon icon={Trash} size="sm" />
					{m.common.delete}
				</Button>
			{/if}
		</div>
	</div>
	{#if event.description}
		<p class="description">{event.description}</p>
	{/if}
	{#if event.source}
		<p class="caption">
			{m.common.wikipediaSource}<a href={event.source.url} rel="external noreferrer" target="_blank"
				>„{event.source.title}”</a
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

	.card.compact {
		width: 328px;
		max-width: 100%;
		padding: 0;
		background: none;
	}

	.compact .head {
		flex-wrap: nowrap;
	}

	.compact .description {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 6;
		line-clamp: 6;
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

	h2 a {
		color: inherit;
		text-decoration: none;
	}

	h2 a:hover {
		text-decoration: underline;
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
