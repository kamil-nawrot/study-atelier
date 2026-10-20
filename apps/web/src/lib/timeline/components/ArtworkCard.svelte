<script lang="ts">
	import { resolve } from '$app/paths';
	import { eraName } from '#lib/collection/eras.ts';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { TimelineEvent } from '../types.ts';

	type Props = {
		artwork: WallArtwork;
		events?: readonly TimelineEvent[];
		onevent?: (event: TimelineEvent) => void;
	};

	let { artwork, events = [], onevent }: Props = $props();

	let details = $derived(
		[artwork.eraCode ? eraName(artwork.eraCode) : undefined, ...artwork.styles].filter(Boolean)
	);
</script>

<section class="card" aria-label={m.timeline.card.artwork}>
	<span class="kind caption">{m.timeline.card.artwork}</span>
	<a href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}>
		<cite class="artwork-title">{artwork.title}</cite>
	</a>
	<p>{[artwork.authors.join(', '), artwork.date].filter(Boolean).join(' · ')}</p>
	{#if details.length > 0}
		<p class="caption">{details.join(' · ')}</p>
	{/if}
	{#if events.length > 0}
		<div class="events">
			<span class="caption">{m.timeline.card.eventsOfTime}</span>
			<ul>
				{#each events as event (event.id)}
					<li>
						<button class="event" onclick={() => onevent?.(event)} type="button">
							{event.name}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>

<style>
	.card {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-4);
		background: var(--color-surface);
	}

	.events {
		display: grid;
		gap: var(--spacing-2);
		margin-top: var(--spacing-2);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-4);
		padding: 0;
		list-style: none;
	}

	.event {
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-fg);
		text-decoration: underline;
		cursor: pointer;
	}

	.kind {
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}
</style>
