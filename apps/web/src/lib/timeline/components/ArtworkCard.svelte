<script lang="ts">
	import { resolve } from '$app/paths';
	import { eraName } from '#lib/collection/eras.ts';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		artwork: WallArtwork;
	};

	let { artwork }: Props = $props();

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
</section>

<style>
	.card {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-4);
		background: var(--color-surface);
	}

	.kind {
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}
</style>
