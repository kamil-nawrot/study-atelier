<script lang="ts">
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import MoveHorizontal from '@lucide/svelte/icons/move-horizontal';
	import { onMount } from 'svelte';
	import { Icon, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import { WIKIPEDIA_LICENCE_URL } from '#lib/glossary/wikipedia/wikipedia.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import RelationsBand from '#lib/relations/components/RelationsBand/RelationsBand.svelte';
	import type { Relations } from '#lib/relations/types/relations.ts';
	import ArtworksSection from '#lib/wall/components/ArtworksSection/ArtworksSection.svelte';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import EventDeleteDialog from '#lib/timeline/components/EventDeleteDialog/EventDeleteDialog.svelte';
	import { yearsLong } from '#lib/timeline/event-lanes/event-lanes.ts';
	import { eventPath, isSpan } from '#lib/timeline/event-page/event-page.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		event: TimelineEvent;
		artworks: WallArtwork[];
		relations?: Relations;
	};

	let { event, artworks: loaded, relations }: Props = $props();

	const images = new WallImages();

	let toast: Toast;
	let deleteOpen = $state(false);

	let span = $derived(isSpan(event));
	let kind = $derived(span ? m.cardIndex.eventKinds.span : m.cardIndex.eventKinds.single);
	let length = $derived(yearsLong(event));
	let date = $derived(formatDate(event.yearFrom, event.yearTo, event.yearApproximate));
	let artworks = $derived(images.apply(loaded));

	$effect.pre(() => {
		void loaded;
		images.reset();
	});

	onMount(() => {
		const message = page.state.valueMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(eventPath(event.id), { state: {}, shallow: true, replace: true });
	});

	export function askDelete(): void {
		deleteOpen = true;
	}

	async function deleted(removed: TimelineEvent): Promise<void> {
		await goto(resolve('/(app)/atelier/values'), {
			refreshAll: true,
			state: { valueMessage: m.timeline.deleted(removed.name) }
		});
	}
</script>

<div class="page">
	<header>
		<p class="kind">
			<span class="mark" aria-hidden="true">
				<Icon icon={span ? MoveHorizontal : CircleDot} size="sm" />
			</span>
			{m.valuePage.header(kind, m.atelier.count(artworks.length))}
		</p>
		<h1>{event.name}</h1>
		<p class="caption">
			{date}{#if span && length > 0}{` · ${m.timeline.card.length(length)}`}{/if}
		</p>
	</header>

	{#if event.description || event.source}
		<div class="text">
			{#if event.description}
				<p>{event.description}</p>
			{/if}
			{#if event.source}
				<p class="caption">
					{m.common.wikipediaSource}<a
						href={event.source.url}
						rel="external noreferrer"
						target="_blank">„{event.source.title}”</a
					>,
					<a href={WIKIPEDIA_LICENCE_URL} rel="external noreferrer" target="_blank"
						>{event.source.licence}</a
					>
				</p>
			{/if}
		</div>
	{/if}

	{#if relations}
		<RelationsBand {relations} />
	{/if}

	<ArtworksSection
		{artworks}
		empty={m.timeline.card.noArtworks}
		{images}
		title={m.timeline.card.artworksOfTime}
	/>
</div>

<Toast bind:this={toast} />

<EventDeleteDialog {event} ondeleted={deleted} bind:open={deleteOpen} />

<style>
	.page {
		display: grid;
		gap: var(--spacing-8);
	}

	header,
	.text {
		display: grid;
		gap: var(--spacing-2);
		max-width: var(--size-content-default);
	}

	.kind {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.mark {
		display: inline-flex;
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
